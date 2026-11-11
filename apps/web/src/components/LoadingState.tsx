type LoadingStateProps = {
  label: string;
  detail?: string;
  overlay?: boolean;
};

/** Branded loading experience: gradient orbit spinner with elapsed-time hint. */
export default function LoadingState({ label, detail, overlay = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-5 text-center">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-accent/15 border-t-transparent [animation-duration:1.4s]" aria-hidden="true" />
        <span className="absolute inset-1 animate-spin rounded-full border-[3px] border-transparent border-b-transparent border-l-transparent [animation-duration:0.9s] [animation-direction:reverse] border-t-accent" aria-hidden="true" />
        <span
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-accent"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="font-semibold tracking-tight text-foreground">{label}</p>
        {detail && <p className="mt-1.5 text-sm text-muted">{detail}</p>}
        <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 animate-progress" />
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-6 backdrop-blur-md animate-fade-in"
        role="status"
        aria-live="polite"
      >
        <div className="glass-card w-full max-w-sm px-10 py-12 shadow-pop animate-scale-in">{content}</div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[50vh] place-items-center p-8" role="status" aria-live="polite">
      {content}
    </div>
  );
}
