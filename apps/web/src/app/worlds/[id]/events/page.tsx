"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import { ArrowLeftIcon, SparklesIcon } from "@/components/ui/Icons";
import WorldNav from "../WorldNav";
import type { World } from "@/lib/types";

export default function EventHistoryPage() {
  const params = useParams<{ id: string }>();
  const worldId = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.world(worldId)
      .then(setWorld)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load event history"));
  }, [worldId]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-8">
        <div className="glass-card max-w-md p-6 text-center text-sm text-danger">{error}</div>
      </main>
    );
  }

  if (!world) {
    return <LoadingState label="Loading event history…" />;
  }

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={worldId}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active="events"
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="w-full max-w-[680px] border-x border-line">
          <header className="sticky top-0 z-30 flex items-center gap-5 border-b border-line bg-background/75 px-4 py-3 backdrop-blur-xl">
            <Link
              aria-label="Back to events"
              className="icon-btn focus-ring h-9 w-9"
              href={`/worlds/${worldId}?tab=events`}
            >
              <ArrowLeftIcon size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Event history</h1>
              <p className="text-xs text-subtle">{world.events.length} recorded consequences</p>
            </div>
          </header>

          {world.events.length > 0 ? (
            <div className="p-5">
              <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gradient-to-b before:from-indigo-400/60 before:via-fuchsia-400/40 before:to-transparent">
                {world.events.map((event) => (
                  <article className="relative pl-8 animate-fade-in" key={event.id}>
                    <span
                      className="absolute left-0 top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 border-accent bg-background"
                      aria-hidden="true"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                    <div className="glass-card card-hover p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="flex min-w-0 items-center gap-2 font-bold">
                          <SparklesIcon size={14} className="shrink-0 text-accent" />
                          <span className="truncate">{event.title || "World event"}</span>
                        </h2>
                        <span className="shrink-0 rounded-full border border-line bg-surface-2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
                          turn {event.turn}
                        </span>
                      </div>
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{event.content}</p>
                      <div className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-subtle">{event.type}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-14 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
                <SparklesIcon size={28} />
              </span>
              <p className="font-semibold">No consequences yet</p>
              <p className="max-w-xs text-sm text-muted">Make choices in the Events tab and your story&rsquo;s turning points will be recorded here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
