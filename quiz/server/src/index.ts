import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

const PORT = process.env.PORT || 4000;

// --------------------
// Express App
// --------------------
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Quiz backend running 🚀");
});

// --------------------
// HTTP + Socket Server
// --------------------
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // later restrict this
    methods: ["GET", "POST"],
  },
});

    // // --------------------
    // // Redis Client
    // // --------------------
    // export const redis = createClient({
    // url: process.env.REDIS_URL || "redis://localhost:6379",
    // });

    // redis.on("error", (err) => {
    // console.error("Redis error:", err);
    // });

    // (async () => {
    // await redis.connect();
    // console.log("✅ Redis connected");
    // })();

// --------------------
// Socket.IO Logic
// --------------------
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // CREATE ROOM
  socket.on("create-room", async ({ username }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const roomData = {
      host: socket.id,
      players: [{ id: socket.id, username, score: 0 }],
      status: "waiting",
    };

    // await redis.set(`room:${roomCode}`, JSON.stringify(roomData));

    socket.join(roomCode);

    socket.emit("room-created", {
      roomCode,
      roomData,
    });

    console.log(`🏠 Room created: ${roomCode}`);
  });

  // JOIN ROOM
  socket.on("join-room", async ({ roomCode, username }) => {
    const roomKey = `room:${roomCode}`;
    const room = await redis.get(roomKey);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const roomData = JSON.parse(room);

    roomData.players.push({
      id: socket.id,
      username,
      score: 0,
    });

    // await redis.set(roomKey, JSON.stringify(roomData));

    socket.join(roomCode);

    io.to(roomCode).emit("player-joined", roomData);

    console.log(`👤 ${username} joined room ${roomCode}`);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// --------------------
// Start Server
// --------------------
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
