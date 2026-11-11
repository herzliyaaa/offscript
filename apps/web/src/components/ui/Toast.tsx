export default function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return <div role="status" className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#1d9bf0] px-4 py-3 text-sm font-medium shadow-xl">{message}{onClose && <button className="ml-3" onClick={onClose} aria-label="Dismiss">✕</button>}</div>;
}
