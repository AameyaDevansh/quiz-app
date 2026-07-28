"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSocket } from "@/lib/socket";
import { useClerkAuth } from "@/lib/clerk";
import { Socket } from "socket.io-client";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useToasts, ToastStack } from "@/components/common/Toast";

// Kahoot-style bold answer-block colors, cycled by option index.
const ANSWER_COLORS = [
  { bg: "var(--red)", dim: "var(--red-dim)" },
  { bg: "var(--blue)", dim: "var(--blue-dim)" },
  { bg: "var(--yellow)", dim: "var(--yellow-dim)", text: "#1a1025" },
  { bg: "var(--green)", dim: "var(--green-dim)" },
];

type Phase = "waiting" | "question" | "reveal" | "ended";

interface RoomPlayer {
  clerkId: string;
  username: string;
  avatar?: string;
  score: number;
}

interface RoomSnapshot {
  host: string; // clerkId
  quizId: string;
  genre: string;
  status: "waiting" | "active" | "ended";
  visibility: "public" | "private";
  maxPlayers: number;
  currentQuestionIndex: number;
  players: RoomPlayer[];
}

interface QuestionStarted {
  questionIndex: number;
  question: string;
  options: string[];
  type: "MCQ" | "BLANK";
  duration: number;
  totalQuestions: number;
}

interface AnswerResult {
  correct: boolean;
  pointsAwarded: number;
  totalScore: number;
}

interface QuestionEnded {
  questionIndex: number;
  correctAnswer: string;
  leaderboard: RoomPlayer[];
}

interface QuizEnded {
  winner: RoomPlayer | null;
  leaderboard: RoomPlayer[];
}

export default function RoomPage() {
  return (
    <ProtectedRoute>
      <RoomContent />
    </ProtectedRoute>
  );
}

function RoomContent() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken, user } = useClerkAuth();
  const { toasts, showToast } = useToasts();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");

  const [question, setQuestion] = useState<QuestionStarted | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answeredValue, setAnsweredValue] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [reveal, setReveal] = useState<QuestionEnded | null>(null);
  const [final, setFinal] = useState<QuizEnded | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------------
  // Init socket + join room + listeners
  // -----------------------------------
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let s: Socket;

    const init = async () => {
      const token = await getToken();
      if (!token) return;

      s = createSocket(token);
      setSocket(s);

      s.emit("join-room", { roomCode: code });

      s.on("room-updated", (snapshot: RoomSnapshot) => {
        setRoom(snapshot);
        if (snapshot.status === "waiting") setPhase("waiting");
      });

      s.on("room-error", ({ message }: { message: string }) => {
        showToast(message, "error");
        router.push("/dashboard");
      });

      s.on("question-started", (data: QuestionStarted) => {
        setQuestion(data);
        setTimeLeft(data.duration);
        setAnsweredValue(null);
        setAnswerResult(null);
        setReveal(null);
        setPhase("question");
      });

      s.on("answer-result", (data: AnswerResult) => {
        setAnswerResult(data);
      });

      s.on("question-ended", (data: QuestionEnded) => {
        setReveal(data);
        setPhase("reveal");
      });

      s.on("quiz-ended", (data: QuizEnded) => {
        setFinal(data);
        setPhase("ended");
      });
    };

    init();

    return () => {
      // Don't disconnect — the socket is a shared singleton also used by the
      // dashboard; just drop the listeners this page registered.
      s?.off("room-updated");
      s?.off("room-error");
      s?.off("question-started");
      s?.off("answer-result");
      s?.off("question-ended");
      s?.off("quiz-ended");
    };
  }, [isLoaded, isSignedIn, code]);

  // -----------------------------------
  // Client-side countdown display (server BullMQ job is the real authority)
  // -----------------------------------
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase !== "question") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, question?.questionIndex]);

  if (!isLoaded || !isSignedIn || !room) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ToastStack toasts={toasts} />
        <p className="mono" style={{ color: "var(--text-dim)" }}>joining room…</p>
      </div>
    );
  }

  const isHost = room.host === user?.id;

  const handleLeave = () => {
    socket?.emit("leave-room", { roomCode: code });
    router.push("/dashboard");
  };

  const handleStartQuiz = () => {
    socket?.emit("start-quiz", { roomCode: code });
  };

  const handleAnswer = (value: string) => {
    if (!question || answeredValue !== null) return;
    setAnsweredValue(value);
    socket?.emit("submit-answer", { roomCode: code, questionIndex: question.questionIndex, answer: value });
  };

  return (
    <main style={{ minHeight: "100vh" }}>
      <ToastStack toasts={toasts} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 800 }}>
            Room <span style={{ color: "var(--accent-bright)" }}>{code}</span>
          </h1>
          <p className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
            {room.genre} · {room.visibility === "public" ? "🌍 public" : "🔒 private"}
          </p>
        </div>
        <button onClick={handleLeave} className="tactile" style={{
          padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-bright)", background: "transparent",
          color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600,
        }}>
          Leave
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem" }} className="animate-fade-up">
        {phase === "waiting" && (
          <WaitingRoom room={room} isHost={isHost} currentClerkId={user?.id} onStart={handleStartQuiz} />
        )}

        {phase === "question" && question && (
          <QuestionView
            question={question}
            timeLeft={timeLeft}
            answeredValue={answeredValue}
            answerResult={answerResult}
            onAnswer={handleAnswer}
          />
        )}

        {phase === "reveal" && reveal && (
          <RevealView reveal={reveal} currentClerkId={user?.id} />
        )}

        {phase === "ended" && final && (
          <ResultsView final={final} currentClerkId={user?.id} onBackToDashboard={() => router.push("/dashboard")} />
        )}
      </div>
    </main>
  );
}

function WaitingRoom({ room, isHost, currentClerkId, onStart }: {
  room: RoomSnapshot; isHost: boolean; currentClerkId?: string; onStart: () => void;
}) {
  return (
    <>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.3rem", fontWeight: 700 }}>
        Players ({room.players.length}/{room.maxPlayers})
      </h2>

      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {room.players.map((p) => {
          const isYou = p.clerkId === currentClerkId;
          const isRoomHost = p.clerkId === room.host;

          return (
            <div key={p.clerkId} style={{
              borderRadius: "var(--radius-sm)", background: "var(--surface)",
              border: "1px solid var(--border)", padding: "0.875rem 1rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  height: 34, width: 34, borderRadius: "50%",
                  background: "var(--accent-dim)", color: "var(--accent-bright)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                }}>
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{isYou ? "You" : p.username}</p>
                  {isRoomHost && <p className="mono" style={{ fontSize: "0.68rem", color: "var(--accent-bright)" }}>HOST</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
          <button onClick={onStart} disabled={room.players.length < 1} className="tactile" style={{
            padding: "0.9rem 2.5rem", borderRadius: "var(--radius)",
            background: "var(--accent)", color: "#fff", fontWeight: 700,
            fontSize: "1rem", border: "none", boxShadow: "0 4px 0 var(--accent-dim)",
          }}>
            Start Quiz
          </button>
        </div>
      )}
      {!isHost && (
        <p style={{ marginTop: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
          Waiting for the host to start the quiz…
        </p>
      )}
    </>
  );
}

function QuestionView({ question, timeLeft, answeredValue, answerResult, onAnswer }: {
  question: QuestionStarted; timeLeft: number; answeredValue: string | null;
  answerResult: AnswerResult | null; onAnswer: (value: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          QUESTION {question.questionIndex + 1} / {question.totalQuestions}
        </span>
        <span className="mono" style={{
          fontSize: "0.9rem", fontWeight: 700,
          color: timeLeft <= 5 ? "var(--red)" : "var(--accent-bright)",
        }}>
          {timeLeft}s
        </span>
      </div>

      <div style={{
        height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden", marginBottom: "1.75rem",
      }}>
        <div style={{
          height: "100%", background: timeLeft <= 5 ? "var(--red)" : "var(--accent)",
          width: `${Math.max(0, (timeLeft / question.duration) * 100)}%`,
          transition: "width 1s linear",
        }} />
      </div>

      <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.75rem", lineHeight: 1.4 }}>
        {question.question}
      </h2>

      {question.type === "MCQ" ? (
        <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {question.options.map((opt, i) => {
            const isPicked = answeredValue === opt;
            const color = ANSWER_COLORS[i % ANSWER_COLORS.length];
            const locked = answeredValue !== null;
            return (
              <button
                key={i}
                onClick={() => onAnswer(opt)}
                disabled={locked}
                className={locked ? undefined : "tactile"}
                style={{
                  padding: "1.25rem", borderRadius: "var(--radius)", textAlign: "left",
                  border: "none",
                  background: color.bg,
                  color: color.text ?? "#fff",
                  fontSize: "1rem", fontWeight: 700,
                  boxShadow: isPicked ? "0 0 0 4px var(--text)" : "0 4px 0 rgba(0,0,0,0.25)",
                  opacity: locked && !isPicked ? 0.45 : 1,
                  cursor: locked ? "default" : "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <BlankAnswerForm disabled={answeredValue !== null} onSubmit={onAnswer} />
      )}

      {answeredValue !== null && !answerResult && (
        <p className="mono" style={{ marginTop: "1.5rem", color: "var(--text-dim)", fontSize: "0.8rem" }}>
          answer locked in…
        </p>
      )}

      {answerResult && (
        <div style={{
          marginTop: "1.5rem", padding: "1rem", borderRadius: "var(--radius-sm)",
          background: answerResult.correct ? "var(--green-dim)" : "var(--red-dim)",
          color: answerResult.correct ? "var(--green)" : "var(--red)",
          fontWeight: 700,
        }} className="animate-fade-in">
          {answerResult.correct ? `Correct! +${answerResult.pointsAwarded} pts` : "Wrong answer"}
        </div>
      )}
    </div>
  );
}

function BlankAnswerForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer…"
        style={{
          flex: 1, padding: "0.875rem", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--text)", fontSize: "1rem", outline: "none",
        }}
      />
      <button onClick={() => value.trim() && onSubmit(value.trim())} disabled={disabled || !value.trim()} className="tactile" style={{
        padding: "0 1.5rem", borderRadius: "var(--radius-sm)", border: "none",
        background: "var(--accent)", color: "#fff", fontWeight: 700,
        boxShadow: "0 4px 0 var(--accent-dim)",
      }}>
        Submit
      </button>
    </div>
  );
}

function RevealView({ reveal, currentClerkId }: { reveal: QuestionEnded; currentClerkId?: string }) {
  return (
    <div>
      <p className="mono" style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
        CORRECT ANSWER
      </p>
      <div style={{
        padding: "1rem", borderRadius: "var(--radius-sm)", background: "var(--green-dim)",
        color: "var(--green)", fontWeight: 700, marginBottom: "2rem",
      }}>
        {reveal.correctAnswer}
      </div>

      <Leaderboard players={reveal.leaderboard} currentClerkId={currentClerkId} />

      <p style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--text-muted)" }} className="mono">
        next question incoming…
      </p>
    </div>
  );
}

function ResultsView({ final, currentClerkId, onBackToDashboard }: {
  final: QuizEnded; currentClerkId?: string; onBackToDashboard: () => void;
}) {
  return (
    <div>
      {final.winner && (
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }} className="animate-fade-up">
          <p style={{ fontSize: "2.5rem" }}>🏆</p>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {final.winner.clerkId === currentClerkId ? "You won!" : `${final.winner.username} wins!`}
          </h2>
        </div>
      )}

      <Leaderboard players={final.leaderboard} currentClerkId={currentClerkId} />

      <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
        <button onClick={onBackToDashboard} className="tactile" style={{
          padding: "0.875rem 2rem", borderRadius: "var(--radius)",
          background: "var(--accent)", color: "#fff", fontWeight: 700,
          fontSize: "0.95rem", border: "none", boxShadow: "0 4px 0 var(--accent-dim)",
        }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function Leaderboard({ players, currentClerkId }: { players: RoomPlayer[]; currentClerkId?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {players.map((p, i) => {
        const isYou = p.clerkId === currentClerkId;
        return (
          <div key={p.clerkId} className="animate-slide-in" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)",
            background: isYou ? "var(--accent-dim)" : "var(--surface)",
            border: "1px solid", borderColor: isYou ? "var(--accent)" : "var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.85rem", minWidth: 20 }}>
                {i + 1}
              </span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{isYou ? "You" : p.username}</span>
            </div>
            <span className="mono" style={{ fontWeight: 700, color: "var(--accent-bright)" }}>{p.score}</span>
          </div>
        );
      })}
    </div>
  );
}
