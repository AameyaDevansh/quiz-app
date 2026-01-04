import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Main Redis client (rooms, state, etc.)
export const redis = createClient({ url: REDIS_URL });

// Pub/Sub clients for Socket.IO
export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }

  if (!pubClient.isOpen) {
    await pubClient.connect();
  }

  if (!subClient.isOpen) {
    await subClient.connect();
  }

  console.log("✅ Redis clients connected");
};

redis.on("error", (err) => console.error("Redis error:", err));
pubClient.on("error", (err) => console.error("Redis pub error:", err));
subClient.on("error", (err) => console.error("Redis sub error:", err));
