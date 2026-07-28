import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "../config/redis";
import { roomSocket } from "./room.socket";
import { quizSocket } from "./quiz.socket";
import { verifyClerkToken } from "../config/clerk";
import { startQuestionTimerWorker } from "../jobs/questionTimer";
import { handleTimerJob } from "./gameEngine";

interface SocketWithUser extends Socket {
  user?: {
    clerkId: string;
    username: string;
    avatar?: string;
  };
}

export const initSockets = (io: Server) => {
  // 🔁 Redis Adapter (MULTI-INSTANCE SUPPORT)
  io.adapter(createAdapter(pubClient, subClient));

  // Question countdowns are driven by BullMQ delayed jobs (see
  // jobs/questionTimer.ts) rather than Redis keyspace-expiry pub/sub —
  // jobs persist in Redis and survive a restart, and any instance in the
  // fleet can pick one up.
  startQuestionTimerWorker((data) => handleTimerJob(io, data));

  // 🔐 Auth middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = await verifyClerkToken(token);
      const clerkId = payload.sub as string;

      const email = typeof payload.email === "string" ? payload.email : undefined;
      const avatar = typeof payload.picture === "string" ? payload.picture : undefined;
      const username = email ?? `user_${clerkId.slice(0, 6)}`;

      socket.user = { clerkId, username, avatar };

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: SocketWithUser) => {
    console.log(
      "🟢 Socket connected:",
      socket.id,
      socket.user?.clerkId
    );

    roomSocket(io, socket);
    quizSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });
};
