import http from "http";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectRedis } from "./config/redis";
import { initSockets } from "./sockets/index";
import { connectMongo } from "./config/mongo";

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*", // restrict later
      methods: ["GET", "POST"],
    },
  });
  await connectMongo();
  initSockets(io);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
