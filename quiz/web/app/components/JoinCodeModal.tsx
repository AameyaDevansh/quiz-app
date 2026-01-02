type JoinCodeModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function JoinCodeModal({
  open,
  onClose,
}: JoinCodeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white">
        <h2 className="mb-2 text-xl font-semibold">Join with Code</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Enter the room code to join a quiz.
        </p>

        <input
          type="text"
          placeholder="Enter room code"
          className="mb-4 w-full rounded-lg bg-zinc-800 px-4 py-2 text-white outline-none placeholder:text-zinc-500"
        />

        <button
          className="w-full rounded-xl bg-white px-4 py-2 text-black font-semibold hover:bg-zinc-200"
        >
          Join Room
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
