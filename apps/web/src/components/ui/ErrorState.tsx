import { AlertIcon } from "@/components/ui/Icons";

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-slide-up"
    >
      <AlertIcon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{message}</p>
        {onRetry && (
          <button className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
