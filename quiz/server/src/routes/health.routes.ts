import { Router } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redis";

const router = Router();
const CHECK_TIMEOUT_MS = 2500;

const withTimeout = <T>(promise: Promise<T>): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timed out")), CHECK_TIMEOUT_MS)
    ),
  ]);

// Process liveness: useful for platforms deciding whether the Node process
// itself should be restarted. This intentionally does not query dependencies.
router.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store").status(200).json({
    status: "ok",
    service: "quiz-api",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Dependency readiness: use this URL for UptimeRobot. A real command is sent
// to both data stores, and any failure produces an HTTP 503 alert.
router.get("/health/ready", async (_req, res) => {
  const checks = { mongodb: false, redis: false };

  await Promise.allSettled([
    (async () => {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
      await withTimeout(mongoose.connection.db.admin().ping());
      checks.mongodb = true;
    })(),
    (async () => {
      if (!redis.isReady) return;
      checks.redis = (await withTimeout(redis.ping())) === "PONG";
    })(),
  ]);

  const healthy = checks.mongodb && checks.redis;
  res.set("Cache-Control", "no-store").status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "quiz-api",
    checks,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
