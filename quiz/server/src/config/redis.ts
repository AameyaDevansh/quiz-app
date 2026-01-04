import { createClient } from "redis";
import { env } from "./env";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: env.redisUrl,
  });

  redisClient.on("error", (err) => {
    console.error("Redis error:", err);
  });

  await redisClient.connect();
  console.log("Redis connected");

  return redisClient;
}
