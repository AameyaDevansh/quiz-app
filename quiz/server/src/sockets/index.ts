import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "../config/redis";
import { roomSocket } from "./room.socket";
import { quizSocket } from "./quiz.socket";
import { verifyClerkToken } from "../config/clerk";


interface SocketWithUser extends Socket {
  user?: {
    clerkId: string;
  };
}

export const initSockets = (io: Server) => {
  // 🔁 Redis Adapter (MULTI-INSTANCE SUPPORT)
  io.adapter(createAdapter(pubClient, subClient));
  //ttl timeout
    io.adapter(createAdapter(pubClient, subClient));

  subClient.subscribe("__keyevent@0__:expired", async (key) => {
    if (!key.startsWith("timer:")) return;

    const [, roomCode, questionIndex] = key.split(":");

    io.to(roomCode).emit("question-timeout", {
      questionIndex: Number(questionIndex),
    });
  });
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
      socket.user = { clerkId: payload.sub as string };

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
