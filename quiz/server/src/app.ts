import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { errorMiddleware } from "./middlewares/error.middleware";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Quiz backend running 🚀");
  });

  registerRoutes(app);

  app.use(errorMiddleware);

  return app;
};
