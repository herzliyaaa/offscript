"use client";

import { ZapIcon } from "@/components/ui/Icons";
import { formatEnergy } from "@/lib/energy";
import type { WorldEnergy } from "@/lib/types";

/**
 * Shows remaining daily energy plus any bonus energy.
 * - "rail": a card for the desktop navigation rail.
 * - "pill": a compact chip for page headers.
 */
export default function EnergyMeter({
  energy,
  variant,
}: {
  energy: WorldEnergy;
  variant: "rail" | "pill";
}) {
  const low = energy.available < 1;

  if (variant === "pill") {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums ${
          low
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-line bg-surface-2/70 text-muted"
        }`}
        title={`Energy: ${formatEnergy(energy.available)} available · resets at midnight UTC`}
      >
        <ZapIcon size={12} className={low ? "text-warning" : "text-accent"} />
        {formatEnergy(energy.available)}
      </span>
    );
  }

  const percent =
    energy.dailyLimit > 0
      ? Math.round((energy.dailyRemaining / energy.dailyLimit) * 100)
      : 0;

  return (
    <section className="glass-card p-4" aria-label="Energy">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-subtle">
          <ZapIcon size={13} className="text-accent" /> Energy
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${low ? "text-warning" : ""}`}
        >
          {formatEnergy(energy.available)}
        </span>
      </div>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={energy.dailyLimit}
        aria-valuenow={energy.dailyRemaining}
        aria-label="Daily energy remaining"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-subtle">
        <span className="tabular-nums">
          {formatEnergy(energy.dailyRemaining)}/{formatEnergy(energy.dailyLimit)} today
        </span>
        {energy.bonus > 0 && (
          <span className="tabular-nums text-accent">
            +{formatEnergy(energy.bonus)} bonus
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-subtle">Resets at midnight UTC</p>
    </section>
  );
}
