import OpenAI, { toFile } from "openai";

export type Difficulty = "easy" | "medium" | "hard";

interface GenerateQuizInput {
  prompt?: string;
  difficulty: Difficulty;
  questionCount: number;
  genre?: string;
  file?: Express.Multer.File;
}

const quizSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "genre", "questions"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    genre: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "correctAnswer", "type", "timeLimit", "points"],
        properties: {
          question: { type: "string" },
          options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
          correctAnswer: { type: "string" },
          type: { type: "string", enum: ["MCQ"] },
          timeLimit: { type: "number", enum: [15, 20, 30, 45] },
          points: { type: "number", enum: [750, 1000, 1250] },
        },
      },
    },
  },
} as const;

export const generateQuiz = async ({ prompt, difficulty, questionCount, genre, file }: GenerateQuizInput) => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server");
  if (!prompt?.trim() && !file) throw new Error("Enter a topic or upload source material");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let fileId: string | undefined;

  try {
    if (file) {
      const uploaded = await openai.files.create({
        file: await toFile(file.buffer, file.originalname, { type: file.mimetype }),
        purpose: "user_data",
      });
      fileId = uploaded.id;
    }

    const instructions = [
      `Create exactly ${questionCount} ${difficulty} multiple-choice quiz questions.`,
      "Use four distinct, plausible options and ensure correctAnswer exactly matches one option.",
      "Base claims on the uploaded source when present. For a topic-only request, research reliable current sources before writing questions.",
      "Avoid trick wording and ambiguity. Do not mention that AI generated the quiz.",
      genre ? `Classify the quiz under the genre: ${genre}.` : "Choose a short, sensible genre label.",
      prompt?.trim() ? `User request: ${prompt.trim()}` : "Create the quiz from the uploaded material.",
    ].join("\n");

    const content: Array<Record<string, string>> = [{ type: "input_text", text: instructions }];
    if (fileId) content.unshift({ type: "input_file", file_id: fileId });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      tools: fileId ? undefined : [{ type: "web_search" }],
      input: [{ role: "user", content: content as any }],
      text: {
        format: {
          type: "json_schema",
          name: "generated_quiz",
          strict: true,
          schema: quizSchema,
        },
      },
    });

    if (!response.output_text) throw new Error("The AI did not return a quiz");
    const quiz = JSON.parse(response.output_text);
    if (quiz.questions?.length !== questionCount) throw new Error("The AI returned an incomplete quiz; please retry");
    return { ...quiz, difficulty, source: file ? file.originalname : prompt?.trim() };
  } finally {
    if (fileId) await openai.files.delete(fileId).catch(() => undefined);
  }
};
