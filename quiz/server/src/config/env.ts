import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT missing in .env");
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL missing in .env");
}

export const env = {
  port: Number(process.env.PORT),
  redisUrl: process.env.REDIS_URL,
};
