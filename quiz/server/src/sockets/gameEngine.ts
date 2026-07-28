import { Server } from "socket.io";
import { redis } from "../config/redis";
import { Quiz } from "../models/Quiz.model";
import { User } from "../models/User.model";
import { createMatch } from "../services/match.service";
import {
  buildRoomSnapshot,
  cacheQuiz,
  getCachedQuiz,
  metaKey,
  markAnswered,
  incrementScore,
  getScore,
  expireRoomSoon,
  calculateAward,
  BASE_POINTS_FALLBACK,
} from "./roomState";
import { scheduleTimerJob } from "../jobs/questionTimer";

// Cosmetic pause between a question's reveal and the next question starting,
// so players actually get to see the correct answer / leaderboard update.
// Scheduled as its own delayed job (not setTimeout) so it survives a restart
// the same way the question countdown itself does.
const REVEAL_PAUSE_MS = 4000;

// Genre pools can hold hundreds of imported questions (see
// scripts/importOpenTDB.ts) — a single game still only plays a bounded,
// randomly-sampled round, not the entire pool.
const QUESTIONS_PER_GAME = 10;

export class GameError extends Error {}

const sampleQuestions = <T,>(pool: T[], count: number): T[] => {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

export const startQuiz = async (io: Server, roomCode: string, requesterClerkId: string) => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  if (!meta || Object.keys(meta).length === 0) throw new GameError("Room not found");
  if (meta.host !== requesterClerkId) throw new GameError("Only the host can start the quiz");
  if (meta.status !== "waiting") throw new GameError("Quiz already started");

  const quiz = await Quiz.findById(meta.quizId);
  if (!quiz) throw new GameError("Quiz not found");
  if (quiz.questions.length === 0) throw new GameError("Quiz has no questions");

  const roundQuestions = sampleQuestions(quiz.questions, Math.min(QUESTIONS_PER_GAME, quiz.questions.length));
  await cacheQuiz(roomCode, { ...quiz.toObject(), questions: roundQuestions });
  await redis.hSet(metaKey(roomCode), "status", "active");

  await advanceQuestion(io, roomCode, 0);
};

export const advanceQuestion = async (io: Server, roomCode: string, index: number) => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  if (!meta || meta.status === "ended") return; // room gone or already wrapped up — nothing to advance

  const quiz = await getCachedQuiz(roomCode);
  if (!quiz) return;

  if (index >= quiz.questions.length) {
    await endQuiz(io, roomCode);
    return;
  }

  const q = quiz.questions[index];
  const armedAt = Date.now();

  await redis.hSet(metaKey(roomCode), {
    status: "active",
    currentQuestionIndex: String(index),
    questionArmedAt: String(armedAt),
  });

  io.to(roomCode).emit("question-started", {
    questionIndex: index,
    question: q.question,
    options: q.options ?? [],
    type: q.type,
    duration: q.timeLimit,
    totalQuestions: quiz.questions.length,
  });

  await scheduleTimerJob(roomCode, index, "reveal", q.timeLimit * 1000);
};

export interface SubmitAnswerResult {
  duplicate?: true;
  correct?: boolean;
  pointsAwarded?: number;
  totalScore?: number;
}

export const submitAnswer = async (
  roomCode: string,
  clerkId: string,
  questionIndex: number,
  answer: string
): Promise<SubmitAnswerResult> => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  if (!meta || meta.status !== "active" || Number(meta.currentQuestionIndex) !== questionIndex) {
    // question already moved on (or room gone) — a stale/late submit is a silent no-op
    return { duplicate: true };
  }

  const quiz = await getCachedQuiz(roomCode);
  if (!quiz) return { duplicate: true };

  const q = quiz.questions[questionIndex];
  const isNew = await markAnswered(roomCode, questionIndex, clerkId, q.timeLimit);
  if (!isNew) return { duplicate: true };

  const elapsedMs = Date.now() - Number(meta.questionArmedAt);

  const correct =
    q.type === "MCQ"
      ? answer === q.correctAnswer
      : String(answer ?? "").trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

  const award = calculateAward(correct, q.points || BASE_POINTS_FALLBACK, q.timeLimit, elapsedMs);

  if (award > 0) await incrementScore(roomCode, clerkId, award);

  const totalScore = await getScore(roomCode, clerkId);
  return { correct, pointsAwarded: award, totalScore };
};

export const revealAndAdvance = async (io: Server, roomCode: string, questionIndex: number) => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  // idempotency guard: a duplicate/late job for a question we've already
  // moved past (or a room that's gone/ended) is a no-op, not a re-reveal
  if (!meta || meta.status !== "active" || Number(meta.currentQuestionIndex) !== questionIndex) return;

  const quiz = await getCachedQuiz(roomCode);
  if (!quiz) return;

  const q = quiz.questions[questionIndex];
  const snapshot = await buildRoomSnapshot(roomCode);

  io.to(roomCode).emit("question-ended", {
    questionIndex,
    correctAnswer: q.correctAnswer,
    leaderboard: snapshot?.players ?? [],
  });

  await scheduleTimerJob(roomCode, questionIndex + 1, "advance", REVEAL_PAUSE_MS);
};

export const endQuiz = async (io: Server, roomCode: string) => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  if (!meta || meta.status === "ended") return; // already ended — never double-persist a Match

  const snapshot = await buildRoomSnapshot(roomCode);
  const quiz = await getCachedQuiz(roomCode);

  await redis.hSet(metaKey(roomCode), "status", "ended");

  const winner = snapshot?.players[0];

  if (snapshot && quiz && snapshot.players.length > 0) {
    const users = await User.find({ clerkId: { $in: snapshot.players.map((p) => p.clerkId) } });
    const userIdByClerkId = new Map(users.map((u) => [u.clerkId, u._id]));

    const scores: Record<string, number> = {};
    snapshot.players.forEach((p) => {
      scores[p.clerkId] = p.score;
    });

    const playerIds = snapshot.players
      .map((p) => userIdByClerkId.get(p.clerkId))
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    if (playerIds.length > 0) {
      await createMatch({
        matchCode: roomCode,
        players: playerIds,
        winner: winner ? userIdByClerkId.get(winner.clerkId) : undefined,
        scores,
        totalQuestions: quiz.questions.length,
      });
    }
  }

  await expireRoomSoon(roomCode);

  io.to(roomCode).emit("quiz-ended", {
    winner: winner ?? null,
    leaderboard: snapshot?.players ?? [],
  });
};

// Entry point for the BullMQ worker (see jobs/questionTimer.ts) — dispatches
// a fired timer job to the right engine step.
export const handleTimerJob = async (
  io: Server,
  data: { roomCode: string; questionIndex: number; kind: "reveal" | "advance" }
) => {
  if (data.kind === "reveal") {
    await revealAndAdvance(io, data.roomCode, data.questionIndex);
  } else {
    await advanceQuestion(io, data.roomCode, data.questionIndex);
  }
};
