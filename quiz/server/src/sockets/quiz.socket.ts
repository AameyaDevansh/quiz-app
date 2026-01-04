import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { redis } from "../config/redis";
import { createMatch } from "../services/match.service";
import { User } from "../models/User.model";

export const quizSocket = (io: Server, socket: Socket & { user?: any }) => {
    //start quiz
    socket.on("start-question", async ({ roomCode, questionIndex }) => {
  const timerKey = `timer:${roomCode}:${questionIndex}`;

  // Set TTL (15 seconds)
  await redis.set(timerKey, "active", {
    EX: 15,
  });

  io.to(roomCode).emit("question-started", {
    questionIndex,
    duration: 15,
  });
});

  // END QUIZ
  socket.on("end-quiz", async ({ roomCode, totalQuestions }) => {
    const key = `room:${roomCode}`;
    const roomRaw = await redis.get(key);
    if (!roomRaw) return;

    const room = JSON.parse(roomRaw);

    // Determine winner
    const sortedPlayers = [...room.players].sort(
      (a, b) => b.score - a.score
    );

    const winnerClerkId = sortedPlayers[0]?.clerkId;

    // Fetch Mongo users
    const users = await User.find({
      clerkId: { $in: room.players.map((p: any) => p.clerkId) },
    });

    const userMap = new Map(
      users.map((u) => [u.clerkId, u._id])
    );

    const scores: Record<string, number> = {};
    room.players.forEach((p: any) => {
      scores[p.clerkId] = p.score;
    });

    // Persist match
    await createMatch({
      matchCode: roomCode,
      players: users.map((u) => u._id),
      winner: userMap.get(winnerClerkId),
      scores,
      totalQuestions,
    });

    // Cleanup Redis
    await redis.del(key);

    io.to(roomCode).emit("quiz-ended", {
      winner: winnerClerkId,
      scores,
    });
  });
};
