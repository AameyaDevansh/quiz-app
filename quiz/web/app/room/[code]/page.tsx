"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSocket } from "@/lib/socket";
import { useClerkAuth } from "@/lib/clerk";
import { Socket } from "socket.io-client";

type Player = {
  socketId: string;
  clerkId: string;
  score: number;
};

type RoomState = {
  host: string;
  players: Player[];
  status: "waiting" | "playing" | "ended";
  visibility: "public" | "private";
  maxPlayers: number;
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken, user } = useClerkAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);

  // -----------------------------------
  // Init socket + join room
  // -----------------------------------
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const init = async () => {
      const token = await getToken();
      if (!token) return;

      const s = createSocket(token);
      setSocket(s);

      // join room by code
      s.emit("join-room", { roomCode: code });

      // listen for updates
      s.on("room-updated", (roomState: RoomState) => {
        setRoom(roomState);
      });

      s.on("room-error", ({ message }) => {
        alert(message);
        router.push("/dashboard");
      });
    };

    init();

    return () => {
      socket?.disconnect();
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Joining room...
      </div>
    );
  }

  const isHost = room.host === socket?.id;

  // -----------------------------------
  // Actions
  // -----------------------------------
  const handleLeave = () => {
    socket?.emit("leave-room", { roomCode: code });
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold">
            Room <span className="text-indigo-400">{code}</span>
          </h1>
          <p className="text-sm text-zinc-400">
            {room.visibility === "public" ? "🌍 Public Room" : "🔒 Private Room"}
          </p>
        </div>

        <button
          onClick={handleLeave}
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Leave
        </button>
      </div>

      {/* MAIN */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">
          Players ({room.players.length}/{room.maxPlayers})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {room.players.map((p) => {
            const isYou = p.clerkId === user?.id;
            const isRoomHost = p.socketId === room.host;

            return (
              <div
                key={p.socketId}
                className="rounded-xl bg-zinc-900 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center font-bold text-black">
                    {p.clerkId.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {isYou ? "You" : "Player"}
                    </p>
                    {isRoomHost && (
                      <p className="text-xs text-indigo-400">Host</p>
                    )}
                  </div>
                </div>

                <span className="text-sm text-zinc-400">
                  Score: {p.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* HOST CONTROLS */}
        {isHost && room.status === "waiting" && (
          <div className="mt-10 flex justify-center">
            <button
              className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-black hover:bg-indigo-400"
              onClick={() => alert("Start quiz coming next")}
            >
              Start Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
