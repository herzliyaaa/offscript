export default function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span aria-label={label} className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" />;
}
