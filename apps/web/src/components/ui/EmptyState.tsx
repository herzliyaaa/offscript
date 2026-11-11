import type { ReactNode } from "react";

export default function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 p-12 text-center animate-fade-in">
      {icon && (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action}
    </div>
  );
}
