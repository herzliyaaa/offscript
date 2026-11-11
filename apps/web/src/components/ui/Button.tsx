import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_2px_12px_rgba(139,92,246,0.35)] hover:brightness-110 hover:shadow-[0_4px_20px_rgba(139,92,246,0.5)] active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-foreground border border-line hover:bg-surface-3 hover:border-line-strong active:scale-[0.98]",
  outline:
    "border border-accent/50 text-accent hover:bg-accent/10 hover:border-accent active:scale-[0.98]",
  ghost: "text-muted hover:text-foreground hover:bg-foreground/[0.06] active:scale-[0.98]",
  danger:
    "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_2px_12px_rgba(244,63,94,0.35)] hover:brightness-110 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-2xl px-6 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex select-none items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
