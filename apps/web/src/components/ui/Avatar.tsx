type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
};

const sizeClass = {
  xs: "h-7 w-7 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-24 w-24 text-2xl",
} as const;

function initials(name?: string) {
  return (name?.trim() || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Deterministic avatar gradient per character name, so identities feel stable. */
function gradientFor(name?: string) {
  const gradients = [
    "from-indigo-500 to-violet-500",
    "from-sky-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-fuchsia-500 to-pink-500",
    "from-rose-500 to-orange-400",
    "from-amber-400 to-rose-500",
    "from-emerald-400 to-teal-500",
    "from-cyan-400 to-blue-500",
  ];
  const key = (name ?? "?").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[key % gradients.length];
}

export default function Avatar({ name, src, size = "md", ring = false }: AvatarProps) {
  const ringClass = ring ? "ring-2 ring-surface" : "";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`${sizeClass[size]} ${ringClass} shrink-0 rounded-full object-cover`}
      src={src}
      alt={`${name ?? "Character"} avatar`}
    />
  ) : (
    <div
      className={`${sizeClass[size]} ${ringClass} grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white ${gradientFor(name)}`}
    >
      {initials(name)}
    </div>
  );
}
