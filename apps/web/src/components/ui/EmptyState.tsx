export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="rounded-2xl border border-dashed border-[#38444d] p-8 text-center"><h2 className="font-bold">{title}</h2>{description && <p className="mt-2 text-sm text-[#71767b]">{description}</p>}</div>;
}
