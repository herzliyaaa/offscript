type LoadingStateProps = {
  label: string;
  detail?: string;
  overlay?: boolean;
};

export default function LoadingState({
  label,
  detail,
  overlay = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-[#1d9bf0]/25 border-t-[#1d9bf0]"
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold text-[#e7e9ea]">{label}</p>
        {detail && <p className="mt-1 text-sm text-[#71767b]">{detail}</p>}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-[#0f1419]/75 p-6 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#38444d] bg-[#15202b] px-8 py-10 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[50vh] place-items-center p-8" role="status" aria-live="polite">
      {content}
    </div>
  );
}
