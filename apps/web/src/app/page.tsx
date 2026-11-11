'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingState from '@/components/LoadingState';
import AvatarPicker from '@/components/AvatarPicker';
import OptionPills from '@/components/OptionPills';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { AppLogo, Wordmark } from '@/components/AppLogo';
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon, GlobeIcon, PlusIcon, SearchIcon, SparklesIcon, ZapIcon } from '@/components/ui/Icons';
import { followerOptions, genderOptions } from '@/components/characterOptions';
import { formatEnergy } from '@/lib/energy';
import type { CelebrityPreset, Scenario, World } from '@/lib/types';

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Your profile' },
    { n: 2, label: 'People you know' },
  ];
  return (
    <ol className="flex items-center gap-2" aria-label="Setup progress">
      {steps.map(({ n, label }, index) => {
        const done = step > n;
        const active = step === n;
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all duration-300 ${
                done
                  ? 'bg-success/15 text-success'
                  : active
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]'
                    : 'border border-line-strong bg-surface-2 text-subtle'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <CheckIcon size={13} strokeWidth={3} /> : n}
            </span>
            <span className={`text-xs font-semibold ${active ? 'text-foreground' : 'text-subtle'}`}>{label}</span>
            {index < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-line-strong sm:w-10" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {creating && (
        <LoadingState
          label="Creating your world…"
          detail={`${elapsed}s elapsed · setting the scene and cast`}
          overlay
        />
      )}

      <header className="flex items-start justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <AppLogo size={56} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <Wordmark className="text-3xl" />
            </h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
              A social-media life sim. Create a world, post, DM celebrities, trigger events — and see how far off-script you can go.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {error && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm leading-relaxed text-danger animate-slide-up">
          {error}
        </div>
      )}

      <section className="mt-10 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Create a new world</h2>
          <StepIndicator step={setupStep} />
        </div>

        {setupStep === 1 ? (
          <div className="glass-card space-y-6 p-5 sm:p-7 animate-fade-in">
            <AvatarPicker
              id="world-player-avatar"
              preview={playerAvatarUrl}
              onChange={(file, preview) => {
                setPlayerAvatarFile(file);
                setPlayerAvatarUrl(preview);
              }}
              onError={setError}
            />

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted">Scenario</span>
                <div className="mt-2 grid gap-2.5">
                  {scenarios.map((s) => {
                    const selected = scenarioKey === s.key;
                    return (
                      <button
                        type="button"
                        key={s.key}
                        aria-pressed={selected}
                        className={`group focus-ring relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                          selected
                            ? 'border-accent/70 bg-accent/[0.07] shadow-[0_4px_20px_var(--accent-soft)]'
                            : 'border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2/70'
                        }`}
                        onClick={() => setScenarioKey(s.key)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-bold ${selected ? 'text-accent' : ''}`}>{s.title}</div>
                            <div className="mt-0.5 text-[13px] leading-relaxed text-muted">{s.tagline}</div>
                          </div>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${
                              selected
                                ? 'border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                                : 'border-line-strong text-transparent group-hover:border-subtle'
                            }`}
                            aria-hidden="true"
                          >
                            <CheckIcon size={11} strokeWidth={3} />
                          </span>
                        </div>
                        {selected && s.themes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.themes.slice(0, 4).map((theme) => (
                              <span key={theme} className="chip !py-0.5 !text-[10px]">{theme}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="player-name"
                  label="Player name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Mina Park"
                />
                <Input
                  id="player-handle"
                  label="Username"
                  value={playerHandle}
                  onChange={(e) => setPlayerHandle(e.target.value)}
                  placeholder="@yourhandle"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <OptionPills
                    label="Gender"
                    value={playerGender}
                    options={[{ value: '', label: 'Not specified' }, ...genderOptions]}
                    onChange={setPlayerGender}
                  />
                </div>
                <div className="space-y-2">
                  <OptionPills
                    label="Follower count"
                    value={playerFollowerCount}
                    options={[{ value: 0, label: 'None' }, ...followerOptions]}
                    onChange={setPlayerFollowerCount}
                  />
                </div>
              </div>

              <Textarea
                placeholder="Player persona (optional) — who are you in this world?"
                value={playerPersona}
                onChange={(e) => setPlayerPersona(e.target.value)}
              />
              <Textarea
                placeholder="Anything else about this character…"
                value={playerAdditionalDescription}
                onChange={(e) => setPlayerAdditionalDescription(e.target.value)}
              />
              <Input
                id="world-name"
                label="World name (optional)"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="A catchy name for your world"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => setSetupStep(2)}
              disabled={!playerName.trim() || !scenarioKey}
              icon={<ChevronRightIcon size={16} />}
            >
              Next: choose people to interact with
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold tracking-tight">People you&rsquo;re already connected with</h3>
                {associatedCelebrityKeys.length > 0 && (
                  <span className="chip !text-accent !border-accent/30 !bg-accent/10">
                    {associatedCelebrityKeys.length} selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Choose celebrities as your collaborators, mutuals, or existing contacts. You&rsquo;ll interact with them in this world.
              </p>

              <div className="relative mt-4">
                <SearchIcon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  className="field h-11 rounded-full !pl-9"
                  value={celebritySearch}
                  onChange={(e) => setCelebritySearch(e.target.value)}
                  placeholder="Search by name, handle, or role…"
                  aria-label="Search celebrities"
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {filteredCelebrities.map((preset) => {
                  const selected = associatedCelebrityKeys.includes(preset.key);
                  return (
                    <button
                      type="button"
                      key={preset.key}
                      aria-pressed={selected}
                      className={`focus-ring group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-accent/70 bg-accent/[0.07] shadow-[0_4px_20px_var(--accent-soft)]'
                          : 'border-line bg-surface-2/40 hover:border-line-strong'
                      }`}
                      onClick={() =>
                        setAssociatedCelebrityKeys((current) =>
                          selected
                            ? current.filter((key) => key !== preset.key)
                            : [...current, preset.key],
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className={`truncate font-bold ${selected ? 'text-accent' : ''}`}>{preset.name}</div>
                          <div className="truncate text-xs text-subtle">
                            {preset.handle} · {preset.role}
                          </div>
                        </div>
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${
                            selected
                              ? 'border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                              : 'border-line-strong text-transparent group-hover:border-subtle'
                          }`}
                          aria-hidden="true"
                        >
                          <CheckIcon size={11} strokeWidth={3} />
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{preset.bio}</p>
                    </button>
                  );
                })}
              </div>
              {!filteredCelebrities.length && (
                <p className="mt-4 text-center text-sm text-subtle">No people match that search.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setSetupStep(1)} icon={<ArrowLeftIcon size={15} />}>
                Back to profile
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                size="lg"
                onClick={createWorld}
                disabled={creating || !playerName || !scenarioKey || !associatedCelebrityKeys.length}
                icon={<SparklesIcon size={16} />}
              >
                {creating ? `Generating world… ${elapsed}s` : 'Create world'}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <GlobeIcon size={18} className="text-accent" /> Your worlds
        </h2>
        {worlds.length === 0 && (
          <div className="glass-card flex flex-col items-center gap-2 p-10 text-center">
            <PlusIcon size={24} className="text-accent" />
            <p className="font-semibold">No worlds yet</p>
            <p className="max-w-xs text-sm text-muted">Create your first world above and start your story.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {worlds.map((w) => (
            <a
              key={w.id}
              href={`/worlds/${w.id}`}
              className="glass-card card-hover group block p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-bold group-hover:text-accent transition-colors">{w.name}</div>
                <span className="flex shrink-0 items-center gap-1.5">
                  {w.energy && (
                    <span
                      className={`chip !py-0.5 !text-[10px] ${w.energy.available < 1 ? '!text-warning' : ''}`}
                      title={`Energy: ${formatEnergy(w.energy.available)} available · resets at midnight UTC`}
                    >
                      <ZapIcon size={10} /> {formatEnergy(w.energy.available)}
                    </span>
                  )}
                  <span className="chip shrink-0 !py-0.5 !text-[10px]">turn {w.turn}</span>
                </span>
              </div>
              <div className="mt-1 truncate text-[13px] text-subtle">
                {w.playerName} · {w.scenarioKey}
              </div>
              <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted">{w.state.summary}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Enter world <ChevronRightIcon size={13} />
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="mt-14 border-t border-line pt-6 text-center text-xs text-subtle">
        Offscript · an AI social-media life sim
      </footer>
    </main>
  );
}
