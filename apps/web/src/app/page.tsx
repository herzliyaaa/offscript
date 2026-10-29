'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import type { Scenario, World } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [scenarioKey, setScenarioKey] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerPersona, setPlayerPersona] = useState('');
  const [worldName, setWorldName] = useState('');

  useEffect(() => {
    Promise.all([api.scenarios(), api.worlds()])
      .then(([s, w]) => {
        setScenarios(s);
        setWorlds(w);
        if (s.length) setScenarioKey(s[0].key);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!creating) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [creating]);

  async function createWorld() {
    setElapsed(0);
    setCreating(true);
    setError(null);
    try {
      const world = await api.createWorld({
        scenarioKey,
        playerName,
        playerPersona: playerPersona || undefined,
        name: worldName || undefined,
      });
      router.push(`/worlds/${world.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create world');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-8 text-zinc-600 dark:text-[#e7e9ea]">Loading…</div>;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-start justify-between space-y-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Offscript</h1>
          <p className="text-zinc-600 dark:text-[#e7e9ea]">
            A social-media life sim. Create a world, post, DM celebrities, trigger events.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Create a new world</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Scenario</span>
            <select
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              value={scenarioKey}
              onChange={(e) => setScenarioKey(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.title} — {s.tagline}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Player name</span>
            <input
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Mina Park"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Player persona (optional)</span>
            <textarea
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              rows={2}
              value={playerPersona}
              onChange={(e) => setPlayerPersona(e.target.value)}
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">World name (optional)</span>
            <input
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
            />
          </label>
        </div>
        <button
          className="flex items-center gap-2 rounded bg-[#1d9bf0] px-4 py-2 font-medium hover:bg-[#1a8cd8] disabled:opacity-50"
          onClick={createWorld}
          disabled={creating || !playerName || !scenarioKey}
        >
          {creating && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {creating
            ? `Generating world… ${elapsed}s`
            : 'Create world'}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your worlds</h2>
        {worlds.length === 0 && (
          <p className="text-zinc-500">No worlds yet.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {worlds.map((w) => (
            <a
              key={w.id}
              href={`/worlds/${w.id}`}
              className="block rounded border border-zinc-200 dark:border-[#38444d] bg-white dark:bg-[#192734] p-4 hover:border-zinc-600"
            >
              <div className="font-semibold">{w.name}</div>
              <div className="text-sm text-zinc-600 dark:text-[#e7e9ea]">
                {w.playerName} · turn {w.turn} · {w.scenarioKey}
              </div>
              <div className="mt-2 text-sm text-zinc-500 line-clamp-2">
                {w.state.summary}
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
