import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  deleteQuiz,
  QuizValidationError,
} from "../services/quiz.service";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const genre = typeof req.query.genre === "string" ? req.query.genre : undefined;
  const quizzes = await getAllQuizzes(genre);
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
