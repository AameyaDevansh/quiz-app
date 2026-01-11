"use client";

import { useState } from "react";

type CreateRoomModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (visibility: "public" | "private") => void;
};

export default function CreateRoomModal({
  open,
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const [visibility, setVisibility] =
    useState<"public" | "private">("private");

  if (!open) return null;

  const handleCreate = () => {
    onCreate(visibility);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white">
        <h2 className="mb-2 text-xl font-semibold">Create Room</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Start a new quiz room and invite others.
        </p>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setVisibility("private")}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold ${
              visibility === "private"
                ? "bg-indigo-500 text-black"
                : "bg-zinc-800"
            }`}
          >
            🔒 Private
          </button>

          <button
            onClick={() => setVisibility("public")}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold ${
              visibility === "public"
                ? "bg-indigo-500 text-black"
                : "bg-zinc-800"
            }`}
          >
            🌍 Public
          </button>
        </div>

        <button
          onClick={handleCreate}
          className="w-full rounded-xl bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200"
        >
          Create Room
        </button>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
