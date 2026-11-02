'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingState from '@/components/LoadingState';
import AvatarPicker from '@/components/AvatarPicker';
import OptionPills from '@/components/OptionPills';
import { followerOptions, genderOptions } from '@/components/characterOptions';
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
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [celebritySearch, setCelebritySearch] = useState('');
  const [associatedCelebrityKeys, setAssociatedCelebrityKeys] = useState<string[]>([]);
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
        associatedCelebrityKeys,
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

  if (loading) return <LoadingState label="Loading Offscript…" />;

  const filteredCelebrities = celebrityPresets.filter((preset) => {
    const query = celebritySearch.trim().toLowerCase();
    return !query || `${preset.name} ${preset.handle} ${preset.role}`.toLowerCase().includes(query);
  });

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
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 ${setupStep === 1 ? 'bg-[#1d9bf0] text-white' : 'bg-zinc-200 dark:bg-[#192734]'}`}>1. Your profile</span>
          <span className="text-zinc-400">→</span>
          <span className={`rounded-full px-3 py-1 ${setupStep === 2 ? 'bg-[#1d9bf0] text-white' : 'bg-zinc-200 dark:bg-[#192734]'}`}>2. People you know</span>
        </div>
        {setupStep === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AvatarPicker
              id="world-player-avatar"
              preview={playerAvatarUrl}
              onChange={(file, preview) => {
                setPlayerAvatarFile(file);
                setPlayerAvatarUrl(preview);
              }}
              onError={setError}
            />
          </div>
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
          <label className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Username</span>
            <input className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] p-2 text-zinc-900 dark:text-[#e7e9ea]" value={playerHandle} onChange={(e) => setPlayerHandle(e.target.value)} placeholder="@yourhandle" />
          </label>
          <div className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Gender</span>
            <OptionPills
              label=""
              value={playerGender}
              options={[
                { value: '', label: 'Not specified' },
                ...genderOptions,
              ]}
              onChange={setPlayerGender}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm text-zinc-600 dark:text-[#e7e9ea]">Follower count</span>
            <OptionPills
              label=""
              value={playerFollowerCount}
              options={[
                { value: 0, label: 'None' },
                ...followerOptions,
              ]}
              onChange={setPlayerFollowerCount}
            />
          </div>
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
          <button type="button" className="rounded bg-[#1d9bf0] px-4 py-2 font-medium sm:col-span-2" onClick={() => setSetupStep(2)} disabled={!playerName.trim() || !scenarioKey}>
            Next: choose people to interact with →
          </button>
        </div>
        ) : (
        <div className="space-y-4">
          <div className="rounded border border-[#38444d] bg-white dark:bg-[#192734] p-4">
            <h3 className="font-semibold">People you’re already connected with</h3>
            <p className="mt-1 text-sm text-zinc-500">Choose celebrities as your collaborators, mutuals, or existing contacts. You’ll interact with them in this world.</p>
            <input
              className="mt-3 w-full rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#101418] p-2 text-zinc-900 dark:text-[#e7e9ea]"
              value={celebritySearch}
              onChange={(e) => setCelebritySearch(e.target.value)}
              placeholder="Search by name, handle, or role…"
              aria-label="Search celebrities"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {filteredCelebrities.map((preset) => {
                const selected = associatedCelebrityKeys.includes(preset.key);
                return (
                  <button
                    type="button"
                    key={preset.key}
                    aria-pressed={selected}
                    className={`rounded border p-3 text-left transition ${selected ? 'border-[#1d9bf0] bg-[#1d9bf0]/10' : 'border-zinc-300 dark:border-[#38444d] hover:border-[#1d9bf0]'}`}
                    onClick={() => setAssociatedCelebrityKeys((current) => selected ? current.filter((key) => key !== preset.key) : [...current, preset.key])}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{preset.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-[#1d9bf0] text-white' : 'bg-zinc-200 dark:bg-[#101418]'}`}>{selected ? 'Selected' : 'Add'}</span>
                    </div>
                    <div className="text-sm text-zinc-500">{preset.handle} · {preset.role}</div>
                    <p className="mt-1 text-xs text-zinc-500">{preset.bio}</p>
                  </button>
                );
              })}
            </div>
            {!filteredCelebrities.length && <p className="mt-3 text-sm text-zinc-500">No people match that search.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-zinc-300 dark:border-[#38444d] px-4 py-2" onClick={() => setSetupStep(1)}>← Back to profile</button>
            <button type="button" className="flex items-center gap-2 rounded bg-[#1d9bf0] px-4 py-2 font-medium hover:bg-[#1a8cd8] disabled:opacity-50" onClick={createWorld} disabled={creating || !playerName || !scenarioKey || !associatedCelebrityKeys.length}>
              {creating && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {creating ? `Generating world… ${elapsed}s` : 'Create world'}
            </button>
          </div>
        </div>
        )}
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
