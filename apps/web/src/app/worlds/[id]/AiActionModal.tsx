"use client";

import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

export default function AiActionModal({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <section className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-[#38444d] dark:bg-[#192734]">
      <h3 className="text-sm font-semibold">Take an action</h3>
      <Textarea
        rows={2}
        placeholder="I invite the rival idol to my studio at midnight…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
      />
      <Button onClick={onSubmit} disabled={busy || !value.trim()}>Act</Button>
    </section>
  );
}
