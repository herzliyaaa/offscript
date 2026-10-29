'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Scenario, World } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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

  async function createWorld() {
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

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Offscript</h1>
        <p className="text-zinc-400">
          A social-media life sim. Create a world, post, DM celebrities, trigger events.
        </p>
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
            <span className="text-sm text-zinc-400">Scenario</span>
            <select
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
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
            <span className="text-sm text-zinc-400">Player name</span>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Mina Park"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-zinc-400">Player persona (optional)</span>
            <textarea
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
              rows={2}
              value={playerPersona}
              onChange={(e) => setPlayerPersona(e.target.value)}
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-zinc-400">World name (optional)</span>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
            />
          </label>
        </div>
        <button
          className="rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-50"
          onClick={createWorld}
          disabled={creating || !playerName || !scenarioKey}
        >
          {creating ? 'Generating world (this may take a few minutes)…' : 'Create world'}
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
              className="block rounded border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600"
            >
              <div className="font-semibold">{w.name}</div>
              <div className="text-sm text-zinc-400">
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
