type CreateRoomModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateRoomModal({
  open,
  onClose,
}: CreateRoomModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white">
        <h2 className="mb-2 text-xl font-semibold">Create Room</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Start a new quiz room and invite others.
        </p>

        <button
          className="w-full rounded-xl bg-white px-4 py-2 text-black font-semibold hover:bg-zinc-200"
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
