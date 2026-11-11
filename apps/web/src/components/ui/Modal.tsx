import type { ReactNode } from 'react';

export default function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <section className="w-full max-w-lg rounded-2xl bg-[#192734] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="text-[#71767b] hover:text-white" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </section>
    </div>
  );
}
