import { Express } from "express";
import userRoutes from "./user.routes";
import quizRoutes from "./quiz.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/users", userRoutes);
  app.use("/api/quizzes", quizRoutes);
};
