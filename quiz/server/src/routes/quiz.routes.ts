import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { createQuiz, getAllQuizzes } from "../services/quiz.service";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { title, questions } = req.body;
  const quiz = await createQuiz(title, questions, req.user);
  res.status(201).json(quiz);
});

router.get("/", async (_req, res) => {
  const quizzes = await getAllQuizzes();
  res.json(quizzes);
});

export default router;
