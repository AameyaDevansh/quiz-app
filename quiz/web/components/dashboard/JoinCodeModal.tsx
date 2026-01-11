"use client";

import { useState } from "react";

export interface JoinCodeModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (roomCode: string) => void;
}

export default function JoinCodeModal({
  open,
  onClose,
  onJoin,
}: JoinCodeModalProps) {
  const [roomCode, setRoomCode] = useState("");

  if (!open) return null;

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    onJoin(roomCode.trim().toUpperCase());
    setRoomCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Join Room
        </h2>

        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter room code"
          className="mb-4 w-full rounded-md bg-zinc-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm hover:bg-zinc-600"
          >
            Cancel
          </button>

          <button
            onClick={handleJoin}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-black hover:bg-indigo-400"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
