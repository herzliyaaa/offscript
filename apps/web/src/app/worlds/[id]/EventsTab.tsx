"use client";

import Link from "next/link";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import type { ActionOutcome, EventScenario, World } from "@/lib/types";

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
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Your next moves</h2>
          <Link className="text-sm font-bold text-[#1d9bf0] hover:underline" href={`/worlds/${worldId}/events`}>View history</Link>
        </div>
        <p className="mt-1 text-sm text-[#71767b]">Choose how you respond to opportunities, rivalries, and relationship turning points.</p>
      </div>
      {eventOutcome && (
        <section className="rounded-2xl border border-[#1d9bf0]/40 bg-[#192734] p-5">
          <div className="text-sm font-bold text-[#1d9bf0]">The story moves forward</div>
          <h3 className="mt-1 text-xl font-bold">You made your choice</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#e7e9ea]">{eventOutcome.narration}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(eventOutcome.statChanges).filter(([, value]) => value !== 0).map(([name, value]) => (
              <div className="rounded-xl bg-[#101418] p-3 text-sm" key={name}><span className="text-[#71767b]">{name}</span><span aria-label={`${value > 0 ? "increased" : "decreased"} by ${Math.abs(value)}`} className={value > 0 ? "ml-2 text-[#00ba7c]" : "ml-2 text-[#f91880]"}>{value > 0 ? `▲ +${value}` : `▼ ${value}`}</span></div>
            ))}
            {eventOutcome.relationshipChanges.map((change) => (
              <div className="rounded-xl bg-[#101418] p-3 text-sm" key={change.character}><span className="text-[#71767b]">{change.character}</span><span aria-label={`${change.delta >= 0 ? "increased" : "decreased"} by ${Math.abs(change.delta)}`} className={change.delta >= 0 ? "ml-2 text-[#00ba7c]" : "ml-2 text-[#f91880]"}>{change.delta >= 0 ? `▲ +${change.delta}` : `▼ ${change.delta}`}</span><div className="mt-1 text-xs text-[#b8c0c7]">{change.note}</div></div>
            ))}
          </div>
          {eventOutcome.posts.length > 0 && <div className="mt-4 border-t border-[#38444d] pt-4"><div className="text-xs font-bold uppercase tracking-wide text-[#71767b]">What people are saying</div>{eventOutcome.posts.slice(0, 3).map((post) => <p className="mt-2 text-sm" key={post.id}><b>{post.authorHandle}</b> {post.content}</p>)}</div>}
          <Button className="mt-5 rounded-full px-5 py-2" onClick={onContinue}>Continue</Button>
        </section>
      )}
      {eventScenario && !eventOutcome && (
        <article className="rounded-2xl border border-[#38444d] bg-[#192734] p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-end gap-3"><button className="rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold hover:border-[#1d9bf0] disabled:opacity-50" onClick={rerollScenario} disabled={busy}>↻ Reroll</button></div>
          {!editingScenario ? (
            <>
              <h3 className="mt-6 text-2xl font-bold leading-tight">{eventScenario.title}</h3>
              <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-[#e7e9ea]">{eventScenario.description}</p>
              <div className="mt-6 text-sm font-bold text-[#71767b]">What do you do?</div>
              <div className="mt-3 grid gap-3">{eventScenario.choices.map((choice, index) => <button key={`${eventScenario.id}-${index}`} className="rounded-2xl border border-[#536471] p-4 text-left transition hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-50" onClick={() => chooseEvent(choice.action)} disabled={busy}><div className="font-bold">{choice.label}</div><div className="mt-1 text-sm leading-6 text-[#b8c0c7]">{choice.action}</div></button>)}</div>
              <div className="mt-5 border-t border-[#38444d] pt-4">
                <label className="text-sm font-bold">Write your own response</label>
                <Textarea className="mt-2 resize-y rounded-xl bg-[#101418] p-3 leading-6" rows={3} placeholder="Write exactly what you say or do…" value={customResponse} onChange={(event) => setCustomResponse(event.target.value)} disabled={busy} />
                <Button className="mt-2 w-full rounded-full border border-[#1d9bf0] bg-transparent px-4 py-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10" onClick={() => chooseEvent(customResponse)} disabled={busy || !customResponse.trim()}>Send my response</Button>
              </div>
              <button className="mt-4 text-sm text-[#71767b] hover:text-white" onClick={() => setEditingScenario(true)}>Edit scenario</button>
            </>
          ) : (
            <>
              <div className="mt-5 text-sm font-bold text-[#1d9bf0]">Edit scenario</div>
              <input className="mt-2 w-full rounded-xl border border-[#38444d] bg-[#101418] p-3 text-xl font-bold outline-none focus:border-[#1d9bf0]" value={eventScenario.title} onChange={(event) => updateScenario({ title: event.target.value })} disabled={busy} />
              <Textarea className="mt-3 min-h-40 resize-y bg-[#101418] p-3 leading-6" value={eventScenario.description} onChange={(event) => updateScenario({ description: event.target.value })} disabled={busy} />
              <div className="mt-3 grid gap-3">{eventScenario.choices.map((choice, index) => <div className="rounded-xl border border-[#38444d] p-3" key={`${eventScenario.id}-edit-${index}`}><input className="w-full rounded-lg bg-[#101418] p-2 font-bold outline-none" value={choice.label} onChange={(event) => updateChoice(index, { label: event.target.value })} disabled={busy} /><Textarea className="mt-2 rounded-lg bg-[#101418] p-2 leading-6" rows={3} value={choice.action} onChange={(event) => updateChoice(index, { action: event.target.value })} disabled={busy} /></div>)}</div>
              <Button className="mt-4 rounded-full px-5 py-2" onClick={() => setEditingScenario(false)}>Save changes</Button>
              <button className="ml-3 text-sm text-[#71767b] hover:text-white" onClick={() => setEditingScenario(false)}>Done</button>
            </>
          )}
        </article>
      )}
      {!busy && !eventScenario && !eventOutcome && <div className="rounded-2xl border border-[#38444d] bg-[#192734] p-6 text-center text-sm text-[#71767b]">Looking for another complication…</div>}
      {world.relationshipMilestones.length > 0 && <section className="rounded-2xl border border-[#38444d] bg-[#192734] p-5"><h3 className="font-bold">Relationship milestones</h3><div className="mt-3 space-y-3">{world.relationshipMilestones.slice(0, 5).map((milestone) => <div className="border-l-2 border-[#1d9bf0] pl-3" key={milestone.id}><div className="flex items-center justify-between gap-2 text-sm"><span className="font-bold">{milestone.title}</span><span className="text-xs text-[#71767b]">turn {milestone.turn}</span></div><div className="mt-1 text-xs text-[#71767b]">{milestone.previousStatus} → {milestone.nextStatus}</div><p className="mt-1 text-sm text-[#b8c0c7]">{milestone.note}</p></div>)}</div></section>}
    </div>
  );
}
