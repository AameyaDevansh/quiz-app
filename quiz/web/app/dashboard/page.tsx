"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionTile from "../../components/dashboard/ActionTile";
import QuizBrowser from "../../components/dashboard/QuizBrowser";
import CreateRoomModal from "../../components/modals/CreateRoomModal";
import JoinCodeModal from "../../components/modals/JoinCodeModal";

import { useClerkAuth } from "@/lib/clerk";
import { createSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { userApi, type Quiz } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken, user } = useClerkAuth();

  const [token, setToken] = useState<string | null>(null);
  const [openJoin, setOpenJoin] = useState(false);
  const [roomQuiz, setRoomQuiz] = useState<Quiz | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // -----------------------------------
  // Sync user to MongoDB + grab a token for REST calls
  // -----------------------------------
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    (async () => {
      const t = await getToken();
      if (!t) return;
      setToken(t);
      await userApi.me(t).catch(() => {});
    })();
  }, [isLoaded, isSignedIn]);

  // -----------------------------------
  // Initialize socket connection
  // -----------------------------------
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const initSocket = async () => {
      const t = await getToken();
      if (!t) return;

      const s = createSocket(t);
      setSocket(s);

      s.on("room-created", ({ roomCode }) => {
        router.push(`/room/${roomCode}`);
      });

      s.on("room-joined", ({ roomCode }) => {
        router.push(`/room/${roomCode}`);
      });

      s.on("no-public-room", () => {
        alert("No public rooms available right now — try creating one.");
      });

      s.on("room-error", ({ message }) => {
        alert(message);
      });
    };

    initSocket();

    return () => {
      socket?.off("room-created");
      socket?.off("room-joined");
      socket?.off("no-public-room");
      socket?.off("room-error");
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || !token) return null;

  // -----------------------------------
  // Actions
  // -----------------------------------
  const handleCreateRoom = ({ visibility, maxPlayers }: { visibility: "public" | "private"; maxPlayers: number }) => {
    if (!socket || !roomQuiz) return;
    socket.emit("create-room", { quizId: roomQuiz._id, visibility, maxPlayers });
    setRoomQuiz(null);
  };

  const handleJoinRoom = (roomCode: string) => {
    if (!socket) return;
    socket.emit("join-room", { roomCode });
  };

  const handleJoinAnyRoom = () => {
    if (!socket) return;
    socket.emit("join-any-room");
  };

  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }} className="animate-fade-up">
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Welcome, <span style={{ color: "var(--accent-bright)" }}>{user?.firstName ?? "Quizzard"}</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem" }}>
          Pick a genre below to host a room, or jump into an existing one.
        </p>

        <div style={{
          display: "grid", gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: "3rem",
        }}>
          <ActionTile
            icon="🔑"
            title="Join with Code"
            description="Enter a room code from a friend"
            onClick={() => setOpenJoin(true)}
          />
          <ActionTile
            icon="🎯"
            title="Join Random"
            description="Get matched into a public room instantly"
            onClick={handleJoinAnyRoom}
          />
        </div>

        <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.25rem" }}>Host a Game</h2>
        <QuizBrowser token={token} onSelectQuiz={setRoomQuiz} />

        {roomQuiz && (
          <CreateRoomModal
            quiz={roomQuiz}
            onClose={() => setRoomQuiz(null)}
            onCreate={handleCreateRoom}
          />
        )}

        {openJoin && (
          <JoinCodeModal
            onClose={() => setOpenJoin(false)}
            onJoin={handleJoinRoom}
          />
        )}
      </div>
    </main>
  );
}
