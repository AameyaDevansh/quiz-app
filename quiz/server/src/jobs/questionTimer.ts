import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// BullMQ needs its own ioredis connection — it can't reuse the `redis` v5
// client already in config/redis.ts. maxRetriesPerRequest must be null or
// the Worker throws at startup.
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export type TimerJobKind = "reveal" | "advance";

export interface QuestionTimerJobData {
  roomCode: string;
  questionIndex: number;
  kind: TimerJobKind;
}

const QUEUE_NAME = "question-timers";

export const timerQueue = new Queue<QuestionTimerJobData>(QUEUE_NAME, { connection });

// Delayed jobs persist in Redis and survive a server restart, and any
// instance in the fleet can pick one up — unlike the Redis keyspace-expiry
// pub/sub this replaces, which is fire-and-forget with no redelivery.
export const scheduleTimerJob = async (
  roomCode: string,
  questionIndex: number,
  kind: TimerJobKind,
  delayMs: number
) => {
  await timerQueue.add(
    kind,
    { roomCode, questionIndex, kind },
    {
      delay: delayMs,
      // deterministic id: re-scheduling the same (room, question, kind) replaces
      // rather than stacking duplicate jobs
      jobId: `${roomCode}:${questionIndex}:${kind}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
};

export const startQuestionTimerWorker = (
  processor: (data: QuestionTimerJobData) => Promise<void>
) => {
  const worker = new Worker<QuestionTimerJobData>(
    QUEUE_NAME,
    async (job) => processor(job.data),
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error("❌ question-timer job failed:", job?.id, err);
  });

  return worker;
};
