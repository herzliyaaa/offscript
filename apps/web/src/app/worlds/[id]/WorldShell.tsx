"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import LoadingState from "@/components/LoadingState";
import type { World } from "@/lib/types";
import EnergyMeter from "./EnergyMeter";
import WorldNav, { type WorldNavKey } from "./WorldNav";
import WorldSidebar from "./WorldSidebar";

export type Tab = "feed" | "events" | "cast";

const tabs: { key: Tab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "events", label: "Events" },
  { key: "cast", label: "Cast" },
];

export default function WorldShell({
  id,
  world,
  tab,
  lastDuration,
  error,
  busy,
  elapsed,
  children,
}: {
  id: number;
  world: World;
  tab: Tab;
  lastDuration: number | null;
  error: string | null;
  busy: boolean;
  elapsed: number;
  children: ReactNode;
}) {
  const stats = world.state.playerStats;
  const navActive: WorldNavKey = tab === "feed" ? "home" : tab;

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      {busy && <LoadingState label="AI is thinking…" detail={`${elapsed}s elapsed · this can take a minute or two`} overlay />}
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={id}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active={navActive}
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="min-h-screen w-full max-w-[680px] border-x border-line">
          <header className="sticky top-0 z-30 border-b border-line bg-background/75 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight">{world.name}</h1>
                <p className="mt-0.5 truncate text-[13px] text-muted">
                  {world.playerName} · turn {world.turn}
                  {lastDuration !== null && (
                    <span className="ml-2 rounded-full border border-line bg-surface-2/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-subtle">
                      last AI {(lastDuration / 1000).toFixed(1)}s
                    </span>
                  )}
                </p>
              </div>
              {world.energy && <EnergyMeter energy={world.energy} variant="pill" />}
            </div>
          </header>

          <div className="space-y-5 p-5">
            {error && (
              <div className="animate-slide-up whitespace-pre-wrap rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm leading-relaxed text-danger">
                {error}
              </div>
            )}

            <section className="glass-card relative overflow-hidden p-5 animate-fade-in">
              <span
                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 via-violet-400 to-fuchsia-400"
                aria-hidden="true"
              />
              <div className="text-sm font-semibold leading-relaxed text-foreground">{world.state.currentScene}</div>
              <div className="mt-2 text-sm leading-relaxed text-muted italic">{world.state.summary}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip">
                  <span className="text-accent">✦</span> {world.player?.followerCount.toLocaleString() ?? 0} followers
                </span>
                {Object.entries(stats).map(([key, value]) => (
                  <span key={key} className="chip">
                    <span className="capitalize">{key}</span>
                    <span className="font-bold tabular-nums text-foreground">{value}</span>
                  </span>
                ))}
              </div>
              {world.state.goals.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                  {world.state.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" aria-hidden="true" />
                      {goal}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <nav className="flex border-b border-line" aria-label="World sections">
              {tabs.map(({ key, label }) => {
                const isActive = tab === key;
                return (
                  <Link
                    key={key}
                    href={`/worlds/${id}?tab=${key}`}
                    className={`focus-ring relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
                      isActive ? "text-foreground" : "text-subtle hover:text-muted"
                    }`}
                  >
                    {label}
                    {isActive && <span className="tab-underline" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>

            {children}
          </div>
        </section>

        <WorldSidebar id={id} world={world} />
      </div>
    </main>
  );
}
