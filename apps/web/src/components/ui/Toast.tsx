import { CheckCircleIcon, CloseIcon } from "@/components/ui/Icons";

export default function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div
      role="status"
      className="glass-card fixed bottom-6 right-6 z-50 flex items-center gap-3 py-3 pl-4 pr-3 text-sm font-medium shadow-pop animate-slide-up"
    >
      <CheckCircleIcon size={18} className="shrink-0 text-success" />
      <span>{message}</span>
      {onClose && (
        <button className="icon-btn h-7 w-7" onClick={onClose} aria-label="Dismiss">
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
