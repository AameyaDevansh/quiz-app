import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { errorMiddleware } from "./middlewares/error.middleware";
import { allowedOrigins } from "./config/cors";
import healthRoutes from "./routes/health.routes";

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());
  app.use(healthRoutes);

  app.get("/", (_req, res) => {
    res.send("Quiz backend running 🚀");
  });

  registerRoutes(app);

  app.use(errorMiddleware);

  return app;
};
