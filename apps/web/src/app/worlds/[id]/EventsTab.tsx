"use client";

import Link from "next/link";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import {
  ChevronRightIcon,
  HeartIcon,
  QuoteIcon,
  RefreshIcon,
  SparklesIcon,
  ZapIcon,
} from "@/components/ui/Icons";
import type { ActionOutcome, EventScenario, World } from "@/lib/types";
import { canAfford, energyCostHint } from "@/lib/energy";

function StatDelta({ name, value, note }: { name: string; value: number; note?: string }) {
  const positive = value > 0;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 animate-slide-up">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
          positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
        }`}
        aria-hidden="true"
      >
        {positive ? "↑" : "↓"}
      </span>
      <span className="sr-only">{positive ? "increased" : "decreased"} by {Math.abs(value)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{name}</div>
        {note && <div className="truncate text-xs text-subtle">{note}</div>}
      </div>
      <span className={`text-sm font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
        {positive ? `+${value}` : value}
      </span>
    </div>
  );
}

export default function EventsTab({
  world,
  worldId,
  busy,
  eventScenario,
  eventOutcome,
  customResponse,
  editingScenario,
  setCustomResponse,
  setEditingScenario,
  chooseEvent,
  rerollScenario,
  updateScenario,
  updateChoice,
  onContinue,
}: {
  world: World;
  worldId: number;
  busy: boolean;
  eventScenario: EventScenario | null;
  eventOutcome: ActionOutcome | null;
  customResponse: string;
  editingScenario: boolean;
  setCustomResponse: (value: string) => void;
  setEditingScenario: (value: boolean) => void;
  chooseEvent: (action: string) => void;
  rerollScenario: () => void;
  updateScenario: (update: Partial<EventScenario>) => void;
  updateChoice: (index: number, update: Partial<EventScenario["choices"][number]>) => void;
  onContinue: () => void;
}) {
  const canAct = canAfford(world.energy, "act");
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Your next moves</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Choose how you respond to opportunities, rivalries, and turning points.
          </p>
        </div>
        <Link
          className="focus-ring shrink-0 rounded-lg text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          href={`/worlds/${worldId}/events`}
        >
          History →
        </Link>
      </div>

      {eventOutcome && (
        <section className="glass-card relative overflow-hidden p-5 sm:p-6 animate-scale-in">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" aria-hidden="true" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
            <SparklesIcon size={14} /> The story moves forward
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight">You made your choice</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{eventOutcome.narration}</p>
          {Object.values(eventOutcome.statChanges).some((v) => v !== 0) && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {Object.entries(eventOutcome.statChanges)
                .filter(([, value]) => value !== 0)
                .map(([name, value]) => (
                  <StatDelta key={name} name={name} value={value} />
                ))}
            </div>
          )}
          {eventOutcome.relationshipChanges.length > 0 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {eventOutcome.relationshipChanges.map((change) => (
                <StatDelta key={change.character} name={change.character} value={change.delta} note={change.note} />
              ))}
            </div>
          )}
          {eventOutcome.posts.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-subtle">
                <QuoteIcon size={12} /> What people are saying
              </div>
              <div className="mt-3 space-y-2.5">
                {eventOutcome.posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex items-start gap-2.5 rounded-xl bg-surface-2/50 px-3.5 py-2.5">
                    <HeartIcon size={13} className="mt-1 shrink-0 text-like" />
                    <p className="text-sm leading-relaxed">
                      <b className="text-foreground">{post.authorHandle}</b>{" "}
                      <span className="text-muted">{post.content}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button className="mt-6" size="lg" onClick={onContinue}>
            Continue
          </Button>
        </section>
      )}

      {eventScenario && !eventOutcome && (
        <article className="glass-card relative overflow-hidden p-5 sm:p-6 animate-scale-in">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" aria-hidden="true" />
          {!editingScenario ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                  <SparklesIcon size={14} /> A moment arrives
                </div>
                <button
                  className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-muted transition-all hover:border-accent hover:text-accent disabled:opacity-50"
                  onClick={rerollScenario}
                  disabled={busy}
                  title="Reroll this moment for a fresh scenario (free)"
                >
                  <RefreshIcon size={13} /> Reroll
                </button>
              </div>
              <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight">{eventScenario.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted">{eventScenario.description}</p>

              <div className="mt-6 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-subtle">
                <span className="flex items-center gap-2">
                  <ZapIcon size={13} /> What do you do?
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal ${
                    canAct
                      ? "border-line bg-surface-2/60 text-subtle"
                      : "border-danger/40 bg-danger/10 text-danger"
                  }`}
                >
                  {canAct ? `${energyCostHint(world.energy, "act")} per choice` : "Not enough energy"}
                </span>
              </div>
              <div className="mt-3 grid gap-2.5">
                {eventScenario.choices.map((choice, index) => (
                  <button
                    key={`${eventScenario.id}-${index}`}
                    className="group focus-ring flex items-center gap-4 rounded-2xl border border-line bg-surface-2/40 p-4 text-left transition-all duration-200 hover:border-accent/60 hover:bg-accent/[0.07] hover:shadow-[0_4px_20px_var(--accent-soft)] disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => chooseEvent(choice.action)}
                    disabled={busy || !canAct}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-bold tabular-nums transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{choice.label}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">{choice.action}</span>
                    </span>
                    <ChevronRightIcon size={18} className="shrink-0 text-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <label className="text-sm font-bold">Write your own response</label>
                <Textarea
                  className="mt-2"
                  rows={3}
                  placeholder="Write exactly what you say or do…"
                  value={customResponse}
                  onChange={(event) => setCustomResponse(event.target.value)}
                  disabled={busy}
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      canAct
                        ? "border-line bg-surface-2/60 text-subtle"
                        : "border-danger/40 bg-danger/10 text-danger"
                    }`}
                  >
                    <ZapIcon size={11} /> {energyCostHint(world.energy, "act")}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => chooseEvent(customResponse)}
                    disabled={busy || !customResponse.trim() || !canAct}
                  >
                    Send my response
                  </Button>
                </div>
              </div>
              <button
                className="mt-4 text-xs font-semibold text-subtle underline-offset-4 transition-colors hover:text-foreground hover:underline"
                onClick={() => setEditingScenario(true)}
              >
                Edit this scenario
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                <SparklesIcon size={14} /> Edit scenario
              </div>
              <input
                className="field mt-3 text-lg font-bold"
                value={eventScenario.title}
                onChange={(event) => updateScenario({ title: event.target.value })}
                disabled={busy}
              />
              <Textarea
                className="mt-3"
                value={eventScenario.description}
                onChange={(event) => updateScenario({ description: event.target.value })}
                disabled={busy}
              />
              <div className="mt-3 grid gap-3">
                {eventScenario.choices.map((choice, index) => (
                  <div className="rounded-xl border border-line bg-surface-2/40 p-3" key={`${eventScenario.id}-edit-${index}`}>
                    <input
                      className="field font-bold"
                      value={choice.label}
                      onChange={(event) => updateChoice(index, { label: event.target.value })}
                      disabled={busy}
                    />
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={choice.action}
                      onChange={(event) => updateChoice(index, { action: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={() => setEditingScenario(false)}>Save changes</Button>
                <button
                  className="text-sm font-semibold text-subtle transition-colors hover:text-foreground"
                  onClick={() => setEditingScenario(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </article>
      )}

      {!busy && !eventScenario && !eventOutcome && (
        <div className="glass-card flex items-center justify-center gap-3 p-6 text-sm text-muted animate-fade-in">
          <RefreshIcon size={16} className="animate-spin [animation-duration:2s]" />
          Looking for another complication…
        </div>
      )}

      {world.relationshipMilestones.length > 0 && (
        <section className="glass-card p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-subtle">
            <HeartIcon size={14} className="text-like" /> Relationship milestones
          </h3>
          <div className="mt-4 space-y-4">
            {world.relationshipMilestones.slice(0, 5).map((milestone) => (
              <div className="relative border-l-2 border-accent/40 pl-4" key={milestone.id}>
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{milestone.title}</span>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-subtle">turn {milestone.turn}</span>
                </div>
                <div className="mt-0.5 text-xs font-semibold text-accent">
                  {milestone.previousStatus} → {milestone.nextStatus}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{milestone.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
