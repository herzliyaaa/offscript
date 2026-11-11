import type { ReactNode } from "react";

export default function NavigationItem({ label, icon, active, onClick }: { label: string; icon: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      className={`focus-ring flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] transition-all duration-200 ${
        active
          ? "bg-accent/10 font-bold text-foreground"
          : "text-muted hover:bg-foreground/[0.05] hover:text-foreground"
      }`}
      onClick={onClick}
    >
      <span aria-hidden="true" className={active ? "text-accent" : ""}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
