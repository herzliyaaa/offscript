"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import type { World } from "@/lib/types";

export default function EventHistoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const worldId = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.world(worldId)
      .then(setWorld)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load event history"));
  }, [worldId]);

  if (error) {
    return <main className="min-h-screen bg-[#0f1419] p-8 text-red-300">{error}</main>;
  }

  if (!world) {
    return <main className="min-h-screen bg-[#0f1419] p-8 text-[#71767b]">Loading event history…</main>;
  }

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex min-h-screen max-w-[1280px]">
        <aside className="sticky top-0 hidden h-screen w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
          <Link className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]" href={`/worlds/${worldId}`}>𝕏</Link>
          <nav className="space-y-1">
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}`}>⌂ <span className="ml-3">Home</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}/messages`}>✉ <span className="ml-3">Messages</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}?tab=cast`}>◎ <span className="ml-3">Profiles</span></Link>
            <Link className="block rounded-full bg-white/10 px-4 py-3 text-lg font-bold" href={`/worlds/${worldId}/events`}>✦ <span className="ml-3">Event history</span></Link>
          </nav>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4">
            <div className="truncate font-bold">{world.playerName}</div>
            <div className="truncate text-sm text-[#71767b]">{world.name}</div>
            <ThemeToggle />
            <button className="text-sm text-[#71767b] hover:text-white" onClick={() => router.push("/")}>← All worlds</button>
          </div>
        </aside>
        <section className="min-w-0 w-full max-w-[720px] border-x border-[#2f3336]">
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[#2f3336] bg-[#0f1419]/90 px-4 py-3 backdrop-blur-md">
            <Link aria-label="Back to events" className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-white/10" href={`/worlds/${worldId}`}>←</Link>
            <div>
              <h1 className="text-xl font-bold">Event history</h1>
              <p className="text-sm text-[#71767b]">{world.events.length} recorded consequences</p>
            </div>
          </header>
          {world.events.length > 0 ? (
            <div>
              {world.events.map((event) => (
                <article className="border-b border-[#2f3336] p-5" key={event.id}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">{event.title || "World event"}</h2>
                    <span className="text-xs text-[#71767b]">Turn {event.turn}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#b8c0c7]">{event.content}</p>
                  <div className="mt-3 text-xs uppercase tracking-wide text-[#71767b]">{event.type}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-[#71767b]">
              Your story has not left any consequences yet.
            </div>
          )}
        </section>
        <aside className="hidden w-[325px] space-y-4 px-6 py-3 xl:block">
          <div className="rounded-full bg-[#202327] px-4 py-3 text-sm text-[#71767b]">Search this world</div>
          <section className="rounded-2xl bg-[#1c2023] p-4">
            <h2 className="text-xl font-bold">World overview</h2>
            <p className="mt-3 text-sm leading-6 text-[#b8c0c7]">{world.state.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-[#71767b]">Turn</div><b>{world.turn}</b></div>
              <div><div className="text-[#71767b]">Events</div><b>{world.events.length}</b></div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
