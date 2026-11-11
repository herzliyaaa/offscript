"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingState from "@/components/LoadingState";
import type { World } from "@/lib/types";
import WorldSidebar from "./WorldSidebar";

type Tab = "feed" | "events" | "cast";

export default function WorldShell({
  id,
  world,
  tab,
  onTabChange,
  lastDuration,
  error,
  busy,
  elapsed,
  children,
}: {
  id: number;
  world: World;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  lastDuration: number | null;
  error: string | null;
  busy: boolean;
  elapsed: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const stats = world.state.playerStats;

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex max-w-[1280px]">
        <WorldSidebar id={id} world={world} onTabChange={onTabChange} />
        <section className="min-w-0 w-full max-w-[720px] border-x border-[#2f3336]">
          <div className="space-y-4 p-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{world.name}</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {world.playerName} · turn {world.turn} · {world.scenarioKey}
                  {lastDuration ? ` · last AI call ${(lastDuration / 1000).toFixed(1)}s` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button className="text-sm text-zinc-600 dark:text-[#e7e9ea] hover:text-zinc-900 dark:hover:text-white" onClick={() => router.push("/")}>← Home</button>
              </div>
            </header>
            {error && <div className="whitespace-pre-wrap rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            {busy && <LoadingState label="AI is thinking…" detail={`${elapsed}s elapsed · this can take a minute or two`} overlay />}
            <section className="space-y-3 rounded-2xl border border-[#2f3336] bg-[#192734] p-4">
              <div className="text-sm text-zinc-700 dark:text-[#e7e9ea]">{world.state.currentScene}</div>
              <div className="text-sm italic text-zinc-600 dark:text-[#e7e9ea]">{world.state.summary}</div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="rounded-xl bg-[#101418] px-3 py-2 text-xs"><span className="text-[#71767b]">Followers</span>{" "}<span className="font-bold">{world.player?.followerCount ?? 0}</span></div>
                {Object.entries(stats).map(([key, value]) => <div key={key} className="rounded-xl bg-[#101418] px-3 py-2 text-xs"><span className="text-[#71767b]">{key}</span>{" "}<span className="font-mono text-[#e7e9ea]">{value}</span></div>)}
              </div>
              {world.state.goals.length > 0 && <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-[#e7e9ea]">{world.state.goals.map((goal, index) => <li key={index}>{goal}</li>)}</ul>}
            </section>
            <nav className="flex gap-2 border-b border-zinc-200 dark:border-[#38444d]">
              {(["feed", "events", "cast"] as Tab[]).map((item) => <button key={item} className={`px-3 py-2 text-sm capitalize ${tab === item ? "border-b-2 border-blue-500 text-white" : "text-zinc-600 dark:text-[#e7e9ea] hover:text-white"}`} onClick={() => onTabChange(item)}>{item}</button>)}
            </nav>
            {children}
          </div>
        </section>
        <WorldSidebar id={id} world={world} onTabChange={onTabChange} side="right" />
      </div>
    </main>
  );
}
