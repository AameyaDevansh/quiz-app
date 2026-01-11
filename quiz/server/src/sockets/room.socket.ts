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
  visibility: "public" | "private";
  maxPlayers: number;
}

export const roomSocket = (io: Server, socket: Socket & { user?: any }) => {
  // ============================
  // CREATE ROOM
  // ============================
  socket.on("create-room", async ({ visibility = "private" } = {}) => {
    const roomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

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
      visibility,
      maxPlayers: 4,
    };

    await redis.set(`room:${roomCode}`, JSON.stringify(room));

    // 👇 only public rooms go to matchmaking pool
    if (visibility === "public") {
      await redis.sAdd("public:rooms", roomCode);
    }

    socket.join(roomCode);
    socket.emit("room-created", { roomCode });

    console.log(`🏠 ${visibility} room created: ${roomCode}`);
  });

  // ============================
  // JOIN ROOM WITH CODE
  // (works for public & private)
  // ============================
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

    if (room.players.length >= room.maxPlayers) {
      socket.emit("room-error", { message: "Room is full" });
      return;
    }

    room.players.push({
      socketId: socket.id,
      clerkId: socket.user!.clerkId,
      score: 0,
    });

    await redis.set(key, JSON.stringify(room));
    socket.join(roomCode);

    // If room becomes full → remove from public pool
    if (
      room.visibility === "public" &&
      room.players.length >= room.maxPlayers
    ) {
      await redis.sRem("public:rooms", roomCode);
    }

    io.to(roomCode).emit("room-updated", room);
  });

  // ============================
  // JOIN ANY PUBLIC ROOM
  // ============================
  socket.on("join-any-room", async () => {
    const roomCodes = await redis.sMembers("public:rooms");

    for (const roomCode of roomCodes) {
      const key = `room:${roomCode}`;
      const roomRaw = await redis.get(key);

      // cleanup stale room
      if (!roomRaw) {
        await redis.sRem("public:rooms", roomCode);
        continue;
      }

      const room: RoomState = JSON.parse(roomRaw);

      if (
        room.status === "waiting" &&
        room.players.length < room.maxPlayers
      ) {
        room.players.push({
          socketId: socket.id,
          clerkId: socket.user!.clerkId,
          score: 0,
        });

        await redis.set(key, JSON.stringify(room));
        socket.join(roomCode);

        // remove if full
        if (room.players.length >= room.maxPlayers) {
          await redis.sRem("public:rooms", roomCode);
        }

        io.to(roomCode).emit("room-updated", room);
        socket.emit("room-joined", { roomCode });
        return;
      }
    }

    // no available public room
    socket.emit("no-public-room");
  });

  // ============================
  // LEAVE ROOM
  // ============================
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
      await redis.sRem("public:rooms", roomCode);
    } else {
      await redis.set(key, JSON.stringify(room));

      // if public & waiting → ensure it stays discoverable
      if (room.visibility === "public" && room.status === "waiting") {
        await redis.sAdd("public:rooms", roomCode);
      }

      io.to(roomCode).emit("room-updated", room);
    }

    socket.leave(roomCode);
  });
};
