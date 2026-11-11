import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/Icons";

export default function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <section
        className="glass-card w-full max-w-lg p-6 shadow-pop animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button className="icon-btn h-8 w-8" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
