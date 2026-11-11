export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
      <span>{message}</span>
      {onRetry && <button className="ml-3 underline" onClick={onRetry}>Try again</button>}
    </div>
  );
}
