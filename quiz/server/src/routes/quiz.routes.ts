import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  deleteQuiz,
  QuizValidationError,
} from "../services/quiz.service";
import multer from "multer";
import { generateQuiz } from "../services/aiQuiz.service";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

router.post("/generate", authMiddleware, upload.single("file"), async (req: AuthRequest, res) => {
  const difficulty = ["easy", "medium", "hard"].includes(req.body.difficulty)
    ? req.body.difficulty
    : "medium";
  const questionCount = Math.min(20, Math.max(3, Number(req.body.questionCount) || 10));

  try {
    const draft = await generateQuiz({
      prompt: req.body.prompt,
      difficulty,
      questionCount,
      genre: req.body.genre,
      file: req.file,
    });
    res.json(draft);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Quiz generation failed" });
  }
});

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const genre = typeof req.query.genre === "string" ? req.query.genre : undefined;
  const mode = req.query.mode === "ai" || req.query.mode === "classic" ? req.query.mode : undefined;
  const quizzes = await getAllQuizzes(genre, mode);
  res.json(quizzes);
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const quiz = await getQuizById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json(quiz);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const quiz = await createQuiz(req.body, req.user);
    res.status(201).json(quiz);
  } catch (err) {
    if (err instanceof QuizValidationError) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const result = await deleteQuiz(req.params.id, req.user);
  if (result.status !== 200) {
    return res.status(result.status).json({ message: result.message });
  }
  res.json({ ok: true });
});

export default router;
