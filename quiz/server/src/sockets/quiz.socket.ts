import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";
import { metaKey } from "./roomState";
import { startQuiz, submitAnswer, endQuiz, GameError } from "./gameEngine";
import { AuthedUser } from "./room.socket";

type AuthedSocket = Socket & { user?: AuthedUser };

export const quizSocket = (io: Server, socket: AuthedSocket) => {
  // Host-only: kicks off question 0 and the auto-advancing timer chain.
  socket.on("start-quiz", async ({ roomCode }) => {
    try {
      await startQuiz(io, roomCode, socket.user!.clerkId);
    } catch (err) {
      const message = err instanceof GameError ? err.message : "Failed to start quiz";
      socket.emit("room-error", { message });
    }
  });

  // Answers are scored server-side (timing included) and acked privately —
  // the room-wide leaderboard only broadcasts once, at question-ended, so
  // 100 simultaneous submits doesn't mean 100 leaderboard broadcasts.
  socket.on("submit-answer", async ({ roomCode, questionIndex, answer }) => {
    if (!roomCode || typeof questionIndex !== "number") return;

    const result = await submitAnswer(roomCode, socket.user!.clerkId, questionIndex, answer);
    if (result.duplicate) return;

    socket.emit("answer-result", result);
  });

  // Manual abort escape hatch for the host — the primary flow is auto-advance.
  socket.on("end-quiz", async ({ roomCode }) => {
    if (!roomCode) return;
    const host = await redis.hGet(metaKey(roomCode), "host");
    if (host !== socket.user!.clerkId) return;

    await endQuiz(io, roomCode);
  });
};
