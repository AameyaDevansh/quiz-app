"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Create or reuse a single socket instance
 */
export const createSocket = (token: string): Socket => {
  if (!token) {
    throw new Error("Socket token is required");
  }

  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
      {
        auth: {
          token,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });
  }

  return socket;
};

/**
 * Disconnect socket (on logout / cleanup)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
