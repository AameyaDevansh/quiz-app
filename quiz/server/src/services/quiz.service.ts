import { Quiz } from "../models/Quiz.model";
import { IUser } from "../models/User.model";

interface CreateQuizInput {
  title: string;
  description?: string;
  genre: string;
  difficulty?: "easy" | "medium" | "hard";
  mode?: "classic" | "ai";
  source?: string;
  questions: {
    question: string;
    options?: string[];
    correctAnswer: string;
    type: "MCQ" | "BLANK";
    timeLimit?: number;
    points?: number;
  }[];
}

const ANSWER_STRIP = "-questions.correctAnswer";

export class QuizValidationError extends Error {}

const validateQuizInput = (data: CreateQuizInput) => {
  if (!data.title?.trim()) throw new QuizValidationError("Title is required");
  if (!data.genre?.trim()) throw new QuizValidationError("Genre is required");
  if (data.difficulty && !["easy", "medium", "hard"].includes(data.difficulty)) {
    throw new QuizValidationError("Invalid difficulty");
  }
  if (data.mode && !["classic", "ai"].includes(data.mode)) {
    throw new QuizValidationError("Invalid quiz mode");
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new QuizValidationError("At least one question is required");
  }

  data.questions.forEach((q, i) => {
    if (!q.question?.trim()) {
      throw new QuizValidationError(`Question ${i + 1}: text is required`);
    }
    if (!q.correctAnswer?.trim()) {
      throw new QuizValidationError(`Question ${i + 1}: correctAnswer is required`);
    }
    if (q.type === "MCQ") {
      if (!q.options || q.options.length < 2) {
        throw new QuizValidationError(`Question ${i + 1}: MCQ needs at least 2 options`);
      }
      if (!q.options.includes(q.correctAnswer)) {
        throw new QuizValidationError(`Question ${i + 1}: correctAnswer must be one of the options`);
      }
    }
  });
};

export const createQuiz = async (data: CreateQuizInput, user: IUser) => {
  validateQuizInput(data);

  return Quiz.create({
    title: data.title,
    description: data.description,
    genre: data.genre,
    difficulty: data.difficulty ?? "medium",
    mode: data.mode ?? "classic",
    source: data.source,
    questions: data.questions,
    createdBy: user._id,
  });
};

export const getAllQuizzes = async (genre?: string, mode?: "classic" | "ai") => {
  const filter: Record<string, unknown> = {};
  if (genre) filter.genre = genre;
  if (mode === "ai") filter.mode = "ai";
  if (mode === "classic") filter.$or = [{ mode: "classic" }, { mode: { $exists: false } }];
  return Quiz.find(filter)
    .select(ANSWER_STRIP)
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });
};

export const getQuizById = async (id: string) => {
  return Quiz.findById(id).select(ANSWER_STRIP).populate("createdBy", "username");
};

export const deleteQuiz = async (id: string, user: IUser) => {
  const quiz = await Quiz.findById(id);
  if (!quiz) return { status: 404 as const, message: "Quiz not found" };

  const ownerId =
    quiz.createdBy === "AI" ? "AI" : (quiz.createdBy as any).toString();

  if (ownerId !== user._id.toString()) {
    return { status: 403 as const, message: "Not authorized to delete this quiz" };
  }

  await quiz.deleteOne();
  return { status: 200 as const };
};
