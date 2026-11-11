export default function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span
      aria-label={label}
      role="status"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90"
    />
  );
}
