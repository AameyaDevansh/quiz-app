"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionCard from "../../components/dashboard/ActionCard";
import CreateRoomModal from "../../components/dashboard/CreateRoomModal";
import JoinCodeModal from "../../components/dashboard/JoinCodeModal";

import { useClerkAuth } from "@/lib/clerk";
import { createSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { createApiClient } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken, user } = useClerkAuth();

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
  if (!isLoaded || !isSignedIn) return;

  const syncUser = async () => {
    const token = await getToken();
    if (!token) return;

    const api = createApiClient(token);
    await api.get("/users/me"); // 🔥 THIS CREATES USER IN MONGO
  };

  syncUser();
}, [isLoaded, isSignedIn]);
  // -----------------------------------
  // Initialize socket connection
  // -----------------------------------
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const initSocket = async () => {
      const token = await getToken();
      if (!token) return;

      const s = createSocket(token);
      setSocket(s);

      // ROOM CREATED
      s.on("room-created", ({ roomCode }) => {
        router.push(`/room/${roomCode}`);
      });

      // ROOM ERROR
      s.on("room-error", ({ message }) => {
        alert(message);
      });
    };

    initSocket();

    return () => {
      socket?.off("room-created");
      socket?.off("room-error");
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  // -----------------------------------
  // Actions
  // -----------------------------------
  const handleCreateRoom = () => {
    if (!socket) return;
    socket.emit("create-room");
  };

  const handleJoinRoom = (roomCode: string) => {
    if (!socket) return;
    socket.emit("join-room", { roomCode });
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* =========================
          👤 PROFILE ICON
          ========================= */}
      <div className="fixed top-6 right-6 z-20">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center font-semibold text-black shadow">
          {user?.firstName?.charAt(0) ?? "U"}
        </div>
      </div>

      {/* =========================
          🌌 CONSTELLATION
          ========================= */}
      <div className="absolute inset-0 z-0 pointer-events-none animate-constellation">
        <svg viewBox="0 0 1400 900" className="w-full h-full">
          <g stroke="rgba(165,180,252,0.35)" strokeWidth="1">
            <line x1="150" y1="200" x2="400" y2="140" />
            <line x1="400" y1="140" x2="650" y2="280" />
            <line x1="650" y1="280" x2="900" y2="200" />
            <line x1="400" y1="140" x2="350" y2="460" />
            <line x1="350" y1="460" x2="600" y2="620" />
            <line x1="650" y1="280" x2="600" y2="620" />
            <line x1="900" y1="200" x2="1050" y2="420" />
          </g>

          <g fill="rgba(199,210,254,0.9)">
            <circle cx="150" cy="200" r="3.5" />
            <circle cx="400" cy="140" r="4.5" />
            <circle cx="650" cy="280" r="4" />
            <circle cx="900" cy="200" r="4.5" />
            <circle cx="350" cy="460" r="3.5" />
            <circle cx="600" cy="620" r="4.5" />
            <circle cx="1050" cy="420" r="3.5" />
          </g>
        </svg>
      </div>

      {/* =========================
          🌟 MAIN CONTENT
          ========================= */}
      <main className="relative z-10">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="mb-2 text-4xl font-extrabold">
            Welcome{" "}
            <span className="text-indigo-400">
              {user?.firstName ?? "Quizzard"}
            </span>
          </h1>

          <p className="mb-10 text-zinc-300">
            Ready to outsmart your friends?
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              icon="🎮"
              title="Create Room"
              description="Host a new quiz room"
              onClick={() => {
                setOpenCreate(true);
                handleCreateRoom();
              }}
            />

            <ActionCard
              icon="🔑"
              title="Join with Code"
              description="Enter a room code"
              onClick={() => setOpenJoin(true)}
            />

            <ActionCard
              icon="🎯"
              title="Join Random"
              description="Get matched instantly"
              onClick={() => alert("Coming soon")}
            />
          </div>

          <CreateRoomModal
            open={openCreate}
            onClose={() => setOpenCreate(false)}
          />

          <JoinCodeModal
  open={openJoin}
  onClose={() => setOpenJoin(false)}
  onJoin={handleJoinRoom}
/>

        </div>
      </main>

      {/* =========================
          🌊 COSMIC WAVE FOOTER
          ========================= */}
      <div className="absolute bottom-0 left-0 right-0 animate-wave">
        <svg viewBox="0 0 3000 400" className="w-[300%] h-[220px]">
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          <path
            fill="url(#waveGrad)"
            d="M0,260 C250,220 500,300 750,260 C1000,220 1250,300 1500,260
               C1750,220 2000,300 2250,260 C2500,220 2750,300 3000,260
               L3000,400 L0,400 Z"
          />
        </svg>
      </div>

      {/* =========================
          🎞️ ANIMATIONS
          ========================= */}
      <style jsx global>{`
        @keyframes constellationFloat {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(50px, -30px); }
          50% { transform: translate(-50px, -35px); }
          75% { transform: translate(-50px, 60px); }
          100% { transform: translate(0px, 0px); }
        }
        .animate-constellation {
          animation: constellationFloat 20s ease-in-out infinite;
        }
        @keyframes waveScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-66.666%); }
        }
        .animate-wave {
          animation: waveScroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
