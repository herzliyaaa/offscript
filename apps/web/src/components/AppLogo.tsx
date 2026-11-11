import { ZapIcon } from "@/components/ui/Icons";

/** Gradient brand mark for Offscript. */
export function AppLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)]"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent"
        aria-hidden="true"
      />
      <ZapIcon size={size * 0.5} strokeWidth={2.25} className="relative drop-shadow" />
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="text-gradient">Off</span>
      <span className="text-foreground">script</span>
    </span>
  );
}
