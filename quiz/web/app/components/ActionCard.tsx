"use client";

type ActionCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export default function ActionCard({
  title,
  description,
  icon,
  onClick,
}: ActionCardProps) {
  return (
    <div
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-2xl p-6
        bg-zinc-900/90 backdrop-blur
        transition-all duration-300 ease-out
        hover:-translate-y-1
        hover:scale-[1.02]
        hover:shadow-[0_10px_40px_rgba(139,92,246,0.25)]
      "
    >
      {icon && (
        <span className="mb-3 inline-block text-2xl opacity-80 group-hover:opacity-100 transition">
          {icon}
        </span>
      )}

      <h2 className="text-xl font-semibold text-white">{title}</h2>

      {description && (
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      )}
    </div>
  );
}
