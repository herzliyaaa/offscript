"use client";

import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { ChevronRightIcon, ZapIcon } from "@/components/ui/Icons";
import type { WorldEnergy } from "@/lib/types";
import { canAfford, energyCostHint } from "@/lib/energy";

/**
 * Free-form narrative action: describe anything your character says or does
 * and let the AI weave it into the story.
 */
export default function AiActionModal({
  value,
  onChange,
  onSubmit,
  busy,
  energy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  energy?: WorldEnergy;
}) {
  const [expanded, setExpanded] = useState(false);
  const affordable = canAfford(energy, "act");

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="glass-card card-hover focus-ring flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
          <ZapIcon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Take an action</span>
          <span className="block text-[13px] text-muted">Do something off-script — the world will respond</span>
        </span>
        <ChevronRightIcon size={18} className="shrink-0 text-subtle" />
      </button>
    );
  }

  return (
    <section className="glass-card space-y-3 p-4 animate-scale-in sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
          <ZapIcon size={18} />
        </span>
        <div>
          <h3 className="text-sm font-bold">Take an action</h3>
          <p className="text-xs text-muted">Describe what you say or do</p>
        </div>
        <button className="icon-btn ml-auto h-8 w-8" onClick={() => setExpanded(false)} aria-label="Collapse action">
          <ChevronRightIcon size={16} className="rotate-90" />
        </button>
      </div>
      <Textarea
        rows={2}
        placeholder="I invite the rival idol to my studio at midnight…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            affordable
              ? "border-line bg-surface-2/60 text-subtle"
              : "border-danger/40 bg-danger/10 text-danger"
          }`}
          title="Energy cost of acting"
        >
          <ZapIcon size={11} /> {energyCostHint(energy, "act")}
        </span>
        <Button onClick={onSubmit} disabled={busy || !value.trim() || !affordable} icon={<ZapIcon size={15} />}>
          Act
        </Button>
      </div>
    </section>
  );
}
