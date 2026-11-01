'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingState from '@/components/LoadingState';
import type { CelebrityPreset, Scenario, World } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [celebrityPresets, setCelebrityPresets] = useState<CelebrityPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [scenarioKey, setScenarioKey] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerPersona, setPlayerPersona] = useState('');
  const [playerCelebrityKey, setPlayerCelebrityKey] = useState('');
  const [playerHandle, setPlayerHandle] = useState('');
  const [playerGender, setPlayerGender] = useState('');
  const [playerAdditionalDescription, setPlayerAdditionalDescription] = useState('');
  const [playerFollowerCount, setPlayerFollowerCount] = useState(0);
  const [playerAvatarUrl, setPlayerAvatarUrl] = useState('');
  const [playerAvatarFile, setPlayerAvatarFile] = useState<File | null>(null);
  const [worldName, setWorldName] = useState('');

  useEffect(() => {
    Promise.all([api.scenarios(), api.worlds(), api.celebrityPresets()])
      .then(([s, w, presets]) => {
        setScenarios(s);
        setWorlds(w);
        setCelebrityPresets(presets);
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
        playerCelebrityKey: playerCelebrityKey || undefined,
        playerHandle: playerHandle || undefined,
        playerGender: playerGender || undefined,
        playerAdditionalDescription: playerAdditionalDescription || undefined,
        playerFollowerCount,
        playerAvatarUrl: playerAvatarFile
          ? await api.uploadAvatar(playerAvatarFile)
          : playerAvatarUrl || undefined,
        name: worldName || undefined,
      });
      router.push(`/worlds/${world.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create world');
    } finally {
      setCreating(false);
    }
  }

  function chooseCelebrity(key: string) {
    setPlayerCelebrityKey(key);
    const preset = celebrityPresets.find((item) => item.key === key);
    if (!preset) return;
    setPlayerName(preset.name);
    setPlayerHandle(preset.handle);
    setPlayerGender(preset.gender);
    setPlayerPersona(preset.bio);
    setPlayerAdditionalDescription(preset.additionalDescription);
    setPlayerFollowerCount(preset.followerCount);
  }

  function readAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Avatar must be an image file.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Avatar must be smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPlayerAvatarUrl(String(reader.result));
    setPlayerAvatarFile(file);
    reader.readAsDataURL(file);
  }

  if (loading) return <LoadingState label="Loading Offscript…" />;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      {creating && (
        <LoadingState
          label="Creating your world…"
          detail={`${elapsed}s elapsed · setting the scene and cast`}
          overlay
        />
      )}
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
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Character type</span>
            <select
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              value={playerCelebrityKey}
              onChange={(e) => chooseCelebrity(e.target.value)}
            >
              <option value="">Create a custom character</option>
              {celebrityPresets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  Play as {preset.name}
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
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Username</span>
            <input className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]" value={playerHandle} onChange={(e) => setPlayerHandle(e.target.value)} placeholder="@yourhandle" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Gender</span>
            <input className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]" value={playerGender} onChange={(e) => setPlayerGender(e.target.value)} placeholder="Optional" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Follower count</span>
            <input type="number" min={0} className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]" value={playerFollowerCount} onChange={(e) => setPlayerFollowerCount(Number(e.target.value))} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Avatar</span>
            <input type="file" accept="image/*" className="w-full text-sm text-zinc-600 dark:text-[#e7e9ea]" onChange={(e) => readAvatar(e.target.files?.[0])} />
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
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Additional description</span>
            <textarea className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]" rows={2} value={playerAdditionalDescription} onChange={(e) => setPlayerAdditionalDescription(e.target.value)} placeholder="Anything else about this character…" />
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
