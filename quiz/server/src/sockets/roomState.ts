import { redis } from "../config/redis";

export const PUBLIC_ROOMS_KEY = "public:rooms";
const ENDED_ROOM_TTL_SECONDS = 5 * 60; // keep final results visible for late refreshes
const ANSWERED_SET_BUFFER_SECONDS = 30;
const QUIZ_CACHE_TTL_SECONDS = 60 * 60; // generous — cleared explicitly on room teardown anyway

export const BASE_POINTS_FALLBACK = 1000;
export const MAX_BONUS_RATIO = 0.5;

export const metaKey = (code: string) => `room:${code}:meta`;
export const playersKey = (code: string) => `room:${code}:players`;
export const scoresKey = (code: string) => `room:${code}:scores`;
export const answeredKey = (code: string, questionIndex: number) =>
  `room:${code}:answered:${questionIndex}`;
export const quizCacheKey = (code: string) => `room:${code}:quiz`;
export const startLockKey = (code: string) => `room:${code}:start-lock`;

export interface RoomPlayer {
  socketId: string;
  clerkId: string;
  username: string;
  avatar?: string;
}

export type RoomStatus = "waiting" | "active" | "ended";

export interface RoomSnapshot {
  host: string; // clerkId
  quizId: string;
  genre: string;
  status: RoomStatus;
  visibility: "public" | "private";
  maxPlayers: number;
  currentQuestionIndex: number;
  players: { clerkId: string; username: string; avatar?: string; score: number }[];
}

// ── Atomic join (Lua) ────────────────────────────────────────────────────
// Rejects if the room isn't waiting; treats an already-present clerkId as a
// reconnect (HSET only, no capacity check); otherwise checks-then-inserts
// against maxPlayers in one atomic step. A plain HLEN-then-HSET (two round
// trips) would let simultaneous joins both observe "room for one more" and
// overshoot the cap under real concurrency — this closes that window since
// Redis executes the whole script as a single, uninterruptible unit.
const ATOMIC_JOIN_SCRIPT = `
local status = redis.call('HGET', KEYS[1], 'status')
if not status then return -1 end
if status ~= 'waiting' then return -2 end

local exists = redis.call('HEXISTS', KEYS[2], ARGV[1])
if exists == 1 then
  redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
  return 2
end

local maxPlayers = tonumber(redis.call('HGET', KEYS[1], 'maxPlayers'))
local count = redis.call('HLEN', KEYS[2])
if count >= maxPlayers then return -3 end

redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
redis.call('ZADD', KEYS[3], 'NX', 0, ARGV[1])
return 1
`;

export type JoinResult = "not_found" | "not_waiting" | "full" | "joined" | "rejoined";

export const atomicJoin = async (
  roomCode: string,
  clerkId: string,
  player: RoomPlayer
): Promise<JoinResult> => {
  const result = (await redis.eval(ATOMIC_JOIN_SCRIPT, {
    keys: [metaKey(roomCode), playersKey(roomCode), scoresKey(roomCode)],
    arguments: [clerkId, JSON.stringify(player)],
  })) as number;

  switch (result) {
    case -1:
      return "not_found";
    case -2:
      return "not_waiting";
    case -3:
      return "full";
    case 2:
      return "rejoined";
    default:
      return "joined";
  }
};

// ── Snapshot ─────────────────────────────────────────────────────────────

export const buildRoomSnapshot = async (roomCode: string): Promise<RoomSnapshot | null> => {
  const meta = await redis.hGetAll(metaKey(roomCode));
  if (!meta || Object.keys(meta).length === 0) return null;

  const [playersRaw, scoresRaw] = await Promise.all([
    redis.hGetAll(playersKey(roomCode)),
    redis.zRangeWithScores(scoresKey(roomCode), 0, -1, { REV: true }),
  ]);

  const scoreByClerkId = new Map(scoresRaw.map((s) => [s.value, s.score]));

  const players = Object.entries(playersRaw)
    .map(([clerkId, raw]) => {
      const p = JSON.parse(raw) as RoomPlayer;
      return {
        clerkId,
        username: p.username,
        avatar: p.avatar,
        score: scoreByClerkId.get(clerkId) ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    host: meta.host,
    quizId: meta.quizId,
    genre: meta.genre,
    status: meta.status as RoomStatus,
    visibility: meta.visibility as RoomSnapshot["visibility"],
    maxPlayers: Number(meta.maxPlayers),
    currentQuestionIndex: Number(meta.currentQuestionIndex ?? 0),
    players,
  };
};

// ── Quiz cache ───────────────────────────────────────────────────────────
// Fetched from Mongo once (including correctAnswer) at start-quiz, and
// cached here so any server instance / BullMQ worker can read it without
// hitting Mongo again or relying on in-process memory that wouldn't be
// visible across instances.

export interface CachedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  type: "MCQ" | "BLANK";
  timeLimit: number;
  points: number;
}

export interface CachedQuiz {
  _id: string;
  title: string;
  genre: string;
  questions: CachedQuestion[];
}

export const cacheQuiz = async (roomCode: string, quiz: unknown) => {
  await redis.set(quizCacheKey(roomCode), JSON.stringify(quiz), { EX: QUIZ_CACHE_TTL_SECONDS });
};

export const getCachedQuiz = async (roomCode: string): Promise<CachedQuiz | null> => {
  const raw = await redis.get(quizCacheKey(roomCode));
  return raw ? (JSON.parse(raw) as CachedQuiz) : null;
};

// ── Answered-set (duplicate-submission guard) ───────────────────────────

export const markAnswered = async (
  roomCode: string,
  questionIndex: number,
  clerkId: string,
  timeLimitSeconds: number
): Promise<boolean> => {
  const key = answeredKey(roomCode, questionIndex);
  const added = await redis.sAdd(key, clerkId);
  await redis.expire(key, timeLimitSeconds + ANSWERED_SET_BUFFER_SECONDS, "NX");
  return added === 1;
};

// ── Score access ─────────────────────────────────────────────────────────

export const incrementScore = async (roomCode: string, clerkId: string, amount: number) => {
  await redis.zIncrBy(scoresKey(roomCode), amount, clerkId);
};

export const getScore = async (roomCode: string, clerkId: string): Promise<number> => {
  const score = await redis.zScore(scoresKey(roomCode), clerkId);
  return score ?? 0;
};

export const isRoomPlayer = async (roomCode: string, clerkId: string): Promise<boolean> =>
  (await redis.hExists(playersKey(roomCode), clerkId)) === 1;

export const acquireStartLock = async (roomCode: string): Promise<boolean> => {
  const result = await redis.set(startLockKey(roomCode), "1", { NX: true, EX: 30 });
  return result === "OK";
};

export const releaseStartLock = async (roomCode: string) => {
  await redis.del(startLockKey(roomCode));
};

export const markRoomEnded = async (roomCode: string): Promise<boolean> => {
  const result = await redis.eval(
    `if redis.call('HGET', KEYS[1], 'status') ~= 'active' then return 0 end
     redis.call('HSET', KEYS[1], 'status', 'ended')
     return 1`,
    { keys: [metaKey(roomCode)], arguments: [] }
  );
  return Number(result) === 1;
};

// ── Room lifecycle ───────────────────────────────────────────────────────

export const deleteRoom = async (roomCode: string) => {
  await redis.del([
    metaKey(roomCode), playersKey(roomCode), scoresKey(roomCode),
    quizCacheKey(roomCode), startLockKey(roomCode),
  ]);
  await redis.sRem(PUBLIC_ROOMS_KEY, roomCode);
};

// Called when a quiz ends: keep the final snapshot alive briefly so a client
// that refreshes moments later still sees results instead of "room not found".
export const expireRoomSoon = async (roomCode: string) => {
  await Promise.all([
    redis.expire(metaKey(roomCode), ENDED_ROOM_TTL_SECONDS),
    redis.expire(playersKey(roomCode), ENDED_ROOM_TTL_SECONDS),
    redis.expire(scoresKey(roomCode), ENDED_ROOM_TTL_SECONDS),
    redis.expire(quizCacheKey(roomCode), ENDED_ROOM_TTL_SECONDS),
  ]);
  await redis.sRem(PUBLIC_ROOMS_KEY, roomCode);
};

export const generateRoomCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const exists = await redis.exists(metaKey(code));
    if (!exists) return code;
  }
  throw new Error("Failed to generate a unique room code");
};

// ── Scoring ──────────────────────────────────────────────────────────────

export const calculateAward = (
  correct: boolean,
  basePoints: number,
  timeLimitSeconds: number,
  elapsedMs: number
): number => {
  if (!correct) return 0;
  const remainingFraction = Math.max(0, (timeLimitSeconds * 1000 - elapsedMs) / (timeLimitSeconds * 1000));
  return Math.round(basePoints + basePoints * MAX_BONUS_RATIO * remainingFraction);
};
