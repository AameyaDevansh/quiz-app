import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";
import { Quiz } from "../models/Quiz.model";
import {
  atomicJoin,
  buildRoomSnapshot,
  deleteRoom,
  generateRoomCode,
  metaKey,
  playersKey,
  scoresKey,
  PUBLIC_ROOMS_KEY,
  RoomPlayer,
} from "./roomState";

export interface AuthedUser {
  clerkId: string;
  username: string;
  avatar?: string;
}

type AuthedSocket = Socket & { user?: AuthedUser; data: { roomCode?: string } };

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 100;
const DEFAULT_MAX_PLAYERS = 50;

const clampMaxPlayers = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MAX_PLAYERS;
  return Math.min(Math.max(Math.round(n), MIN_PLAYERS), MAX_PLAYERS);
};

// Removes a player from a room's players/scores; if the room becomes empty it
// is torn down entirely; if the departing player was host, host passes to an
// arbitrary remaining player so the room never gets stuck without one.
const removePlayer = async (roomCode: string, clerkId: string) => {
  await redis.hDel(playersKey(roomCode), clerkId);
  await redis.zRem(scoresKey(roomCode), clerkId);

  const remaining = await redis.hLen(playersKey(roomCode));
  if (remaining === 0) {
    await deleteRoom(roomCode);
    return null;
  }

  const host = await redis.hGet(metaKey(roomCode), "host");
  if (host === clerkId) {
    const players = await redis.hGetAll(playersKey(roomCode));
    const nextHost = Object.keys(players)[0];
    if (nextHost) await redis.hSet(metaKey(roomCode), "host", nextHost);
  }

  return buildRoomSnapshot(roomCode);
};

export const roomSocket = (io: Server, socket: AuthedSocket) => {
  const player = (): RoomPlayer => ({
    socketId: socket.id,
    clerkId: socket.user!.clerkId,
    username: socket.user!.username,
    avatar: socket.user!.avatar,
  });

  // ============================
  // CREATE ROOM
  // ============================
  socket.on("create-room", async ({ quizId, visibility = "private", maxPlayers } = {}) => {
    if (!quizId) {
      socket.emit("room-error", { message: "quizId is required" });
      return;
    }

    const quiz = await Quiz.findById(quizId).select("genre");
    if (!quiz) {
      socket.emit("room-error", { message: "Quiz not found" });
      return;
    }

    const roomCode = await generateRoomCode();
    const clerkId = socket.user!.clerkId;
    const cappedMax = clampMaxPlayers(maxPlayers);
    const roomVisibility = visibility === "public" ? "public" : "private";

    await redis
      .multi()
      .hSet(metaKey(roomCode), {
        host: clerkId,
        quizId: String(quizId),
        genre: quiz.genre,
        status: "waiting",
        visibility: roomVisibility,
        maxPlayers: String(cappedMax),
        currentQuestionIndex: "0",
        questionArmedAt: "0",
      })
      .hSet(playersKey(roomCode), clerkId, JSON.stringify(player()))
      .zAdd(scoresKey(roomCode), { score: 0, value: clerkId })
      .exec();

    if (roomVisibility === "public") {
      await redis.sAdd(PUBLIC_ROOMS_KEY, roomCode);
    }

    socket.data.roomCode = roomCode;
    socket.join(roomCode);
    socket.emit("room-created", { roomCode });

    console.log(`🏠 ${roomVisibility} room created: ${roomCode}`);
  });

  // ============================
  // JOIN ROOM WITH CODE
  // ============================
  socket.on("join-room", async ({ roomCode }) => {
    if (!roomCode) return;

    const result = await atomicJoin(roomCode, socket.user!.clerkId, player());

    if (result === "not_found") {
      socket.emit("room-error", { message: "Room not found" });
      return;
    }
    if (result === "not_waiting") {
      socket.emit("room-error", { message: "Game already started" });
      return;
    }
    if (result === "full") {
      socket.emit("room-error", { message: "Room is full" });
      return;
    }

    socket.data.roomCode = roomCode;
    socket.join(roomCode);

    const snapshot = await buildRoomSnapshot(roomCode);
    if (snapshot && snapshot.visibility === "public" && snapshot.players.length >= snapshot.maxPlayers) {
      await redis.sRem(PUBLIC_ROOMS_KEY, roomCode);
    }

    socket.emit("room-joined", { roomCode });
    io.to(roomCode).emit("room-updated", snapshot);
  });

  // ============================
  // JOIN ANY PUBLIC ROOM
  // ============================
  socket.on("join-any-room", async () => {
    const roomCodes = await redis.sMembers(PUBLIC_ROOMS_KEY);

    for (const roomCode of roomCodes) {
      const result = await atomicJoin(roomCode, socket.user!.clerkId, player());

      if (result === "joined" || result === "rejoined") {
        socket.data.roomCode = roomCode;
        socket.join(roomCode);

        const snapshot = await buildRoomSnapshot(roomCode);
        if (snapshot && snapshot.players.length >= snapshot.maxPlayers) {
          await redis.sRem(PUBLIC_ROOMS_KEY, roomCode);
        }

        socket.emit("room-joined", { roomCode });
        io.to(roomCode).emit("room-updated", snapshot);
        return;
      }

      // stale (deleted) or already-started rooms don't belong in the pool anymore
      if (result === "not_found" || result === "not_waiting") {
        await redis.sRem(PUBLIC_ROOMS_KEY, roomCode);
      }
      // "full" -> try the next candidate
    }

    socket.emit("no-public-room");
  });

  // ============================
  // LEAVE ROOM
  // ============================
  socket.on("leave-room", async ({ roomCode }) => {
    if (!roomCode) return;

    const snapshot = await removePlayer(roomCode, socket.user!.clerkId);
    socket.leave(roomCode);
    socket.data.roomCode = undefined;

    if (snapshot) io.to(roomCode).emit("room-updated", snapshot);
  });

  // ============================
  // DISCONNECT CLEANUP
  // ============================
  // A departed socket previously left no trace (players hash was never
  // touched), permanently occupying a maxPlayers slot and leaving a ghost
  // entry in the scoreboard. Mid-quiz disconnects are deliberately NOT
  // removed here — a flaky connection or refresh is the common case in a
  // 100-player game, and a later join-room with the same clerkId restores
  // them via the reconnect branch of atomicJoin.
  socket.on("disconnect", async () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !socket.user) return;

    const status = await redis.hGet(metaKey(roomCode), "status");
    if (status !== "waiting") return;

    const snapshot = await removePlayer(roomCode, socket.user.clerkId);
    if (snapshot) io.to(roomCode).emit("room-updated", snapshot);
  });
};
