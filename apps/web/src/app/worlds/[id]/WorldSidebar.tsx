"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { QuoteIcon, SearchIcon, SparklesIcon, TrendingUpIcon, UsersIcon } from "@/components/ui/Icons";
import type { World } from "@/lib/types";

/** Right rail: world overview + searchable cast quick-list. */
export default function WorldSidebar({ id, world }: { id: number; world: World }) {
  const [query, setQuery] = useState("");

  const people = [...world.cast, ...world.stanAccounts];
  const filtered = people.filter((character) => {
    const q = query.trim().toLowerCase();
    return !q || `${character.name} ${character.handle}`.toLowerCase().includes(q);
  });

  const stats = [
    { label: "Turn", value: world.turn, icon: TrendingUpIcon },
    { label: "Posts", value: world.feed.length, icon: QuoteIcon },
    { label: "Events", value: world.events.length, icon: SparklesIcon },
    { label: "Cast", value: people.length, icon: UsersIcon },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[340px] shrink-0 space-y-4 overflow-y-auto px-6 py-6 xl:block">
      <section className="glass-card p-5">
        <h2 className="text-base font-bold tracking-tight">World overview</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{world.state.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {stats.map(({ label, value, icon: StatIcon }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5">
              <StatIcon size={15} className="shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</div>
                <div className="text-sm font-bold tabular-nums">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-base font-bold tracking-tight">People</h2>
        <div className="relative mt-3">
          <SearchIcon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people…"
            aria-label="Search people in this world"
            className="field h-10 rounded-full !pl-9 text-sm"
          />
        </div>
        <div className="mt-3 space-y-1">
          {filtered.slice(0, 6).map((character) => (
            <Link
              key={character.id}
              href={`/worlds/${id}/profile/${character.id}`}
              className="focus-ring flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-foreground/[0.05]"
            >
              <Avatar name={character.name} src={character.avatarUrl} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{character.name}</div>
                <div className="truncate text-xs text-subtle">{character.handle}</div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="py-2 text-center text-xs text-subtle">No one matches.</p>}
        </div>
        <Link
          href={`/worlds/${id}?tab=cast`}
          className="focus-ring mt-3 block rounded-lg text-center text-sm font-semibold text-accent transition-colors hover:opacity-80"
        >
          View all profiles →
        </Link>
      </section>
    </aside>
  );
}
