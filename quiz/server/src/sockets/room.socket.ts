import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";

interface RoomPlayer {
  socketId: string;
  clerkId: string;
  score: number;
}

interface RoomState {
  host: string;
  players: RoomPlayer[];
  status: "waiting" | "playing" | "ended";
}

export const roomSocket = (io: Server, socket: Socket & { user?: any }) => {
  // CREATE ROOM
  socket.on("create-room", async () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: RoomState = {
      host: socket.id,
      players: [
        {
          socketId: socket.id,
          clerkId: socket.user!.clerkId,
          score: 0,
        },
      ],
      status: "waiting",
    };

    await redis.set(`room:${roomCode}`, JSON.stringify(room));
    socket.join(roomCode);

    socket.emit("room-created", { roomCode });
    console.log(`🏠 Room created: ${roomCode}`);
  });

  // JOIN ROOM
  socket.on("join-room", async ({ roomCode }) => {
    const key = `room:${roomCode}`;
    const roomRaw = await redis.get(key);

    if (!roomRaw) {
      socket.emit("room-error", { message: "Room not found" });
      return;
    }

    const room: RoomState = JSON.parse(roomRaw);

    if (room.status !== "waiting") {
      socket.emit("room-error", { message: "Game already started" });
      return;
    }

    room.players.push({
      socketId: socket.id,
      clerkId: socket.user!.clerkId,
      score: 0,
    });

    await redis.set(key, JSON.stringify(room));
    socket.join(roomCode);

    io.to(roomCode).emit("room-updated", room);
  });

  // LEAVE ROOM
  socket.on("leave-room", async ({ roomCode }) => {
    const key = `room:${roomCode}`;
    const roomRaw = await redis.get(key);
    if (!roomRaw) return;

    const room: RoomState = JSON.parse(roomRaw);
    room.players = room.players.filter(
      (p) => p.socketId !== socket.id
    );

    if (room.players.length === 0) {
      await redis.del(key);
    } else {
      await redis.set(key, JSON.stringify(room));
      io.to(roomCode).emit("room-updated", room);
    }

    socket.leave(roomCode);
  });
};
