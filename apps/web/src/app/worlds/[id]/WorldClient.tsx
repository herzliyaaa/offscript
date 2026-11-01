"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingState from "@/components/LoadingState";
import type { ActionOutcome, EventScenario, Post, World } from "@/lib/types";

type Tab = "feed" | "events" | "cast";

function initials(name?: string) {
  return (name?.trim() || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function WorldPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<Tab>("feed");

  const [postContent, setPostContent] = useState("");
  const [actionText, setActionText] = useState("");

  const [eventScenario, setEventScenario] = useState<EventScenario | null>(null);
  const [customResponse, setCustomResponse] = useState("");
  const [eventOutcome, setEventOutcome] = useState<ActionOutcome | null>(null);
  const [editingScenario, setEditingScenario] = useState(false);

  const loadWorld = useCallback(async () => {
    try {
      const w = await api.world(id);
      setWorld(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load world");
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadWorld();
      setLoading(false);
    })();
  }, [loadWorld]);

  useEffect(() => {
    if (!busy) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    if (tab !== "events" || eventScenario || eventOutcome) return;
    void run(async () => {
      const result = await api.eventScenarios(id);
      setEventScenario(result.scenario);
      setLastDuration(result.durationMs ?? null);
    });
  }, [eventOutcome, eventScenario, id, tab]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitPost() {
    if (!postContent.trim()) return;
    setElapsed(0);
    await run(async () => {
      const r = await api.createPost(id, postContent);
      setLastDuration(r.durationMs ?? null);
      setPostContent("");
      await loadWorld();
    });
  }

  async function submitAction() {
    if (!actionText.trim()) return;
    setElapsed(0);
    await run(async () => {
      const r = await api.act(id, actionText);
      setLastDuration(r.durationMs ?? null);
      setActionText("");
      await loadWorld();
    });
  }

  async function chooseEvent(action: string) {
    setElapsed(0);
    await run(async () => {
      const r = await api.act(id, action);
      setLastDuration(r.durationMs ?? null);
      await loadWorld();
      setEventScenario(null);
      setCustomResponse("");
      setEditingScenario(false);
      setEventOutcome(r);
    });
  }

  function updateScenario(update: Partial<EventScenario>) {
    setEventScenario((current) => current ? { ...current, ...update } : current);
  }

  function updateChoice(index: number, update: Partial<EventScenario["choices"][number]>) {
    setEventScenario((current) => {
      if (!current) return current;
      return {
        ...current,
        choices: current.choices.map((choice, choiceIndex) =>
          choiceIndex === index ? { ...choice, ...update } : choice,
        ),
      };
    });
  }

  function rerollScenario() {
    setEventScenario(null);
    setEventOutcome(null);
    setCustomResponse("");
    setEditingScenario(false);
  }

  if (loading || !world) {
    return <LoadingState label="Loading world…" />;
  }

  const stats = world.state.playerStats;
  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex max-w-[1280px]">
        <aside className="sticky top-0 hidden h-screen w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]">𝕏</div>
          <nav className="space-y-1">
            <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg font-bold hover:bg-white/10" onClick={() => setTab("feed")}>⌂ <span>Home</span></button>
            <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => setTab("feed")}># <span>Explore</span></button>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}/messages`}>✉ <span className="ml-3">Messages</span></Link>
            <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => setTab("cast")}>◎ <span>Profiles</span></button>
            <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => setTab("events")}>✦ <span>Events</span></button>
          </nav>
          <button className="mt-5 w-full rounded-full bg-[#1d9bf0] py-3 font-bold hover:bg-[#1a8cd8]" onClick={() => setTab("feed")}>Post</button>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4">
            <div className="truncate text-sm font-bold">{world.playerName}</div>
            <div className="truncate text-xs text-[#71767b]">{world.name}</div>
            <ThemeToggle />
            <button className="block text-sm text-[#71767b] hover:text-white" onClick={() => router.push("/")}>← All worlds</button>
          </div>
        </aside>
        <section className="min-w-0 w-full max-w-[720px] border-x border-[#2f3336]">
          <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{world.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {world.playerName} · turn {world.turn} · {world.scenarioKey}
            {lastDuration
              ? ` · last AI call ${(lastDuration / 1000).toFixed(1)}s`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="text-sm text-zinc-600 dark:text-[#e7e9ea] hover:text-zinc-900 dark:hover:text-white"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {busy && (
        <LoadingState
          label="AI is thinking…"
          detail={`${elapsed}s elapsed · this can take a minute or two`}
          overlay
        />
      )}

      {/* <section className="rounded border border-zinc-200 dark:border-[#38444d] bg-white dark:bg-[#192734] p-4 space-y-2">
        <div className="text-sm text-zinc-700 dark:text-[#e7e9ea]">
          {world.state.currentScene}
        </div>
        <div className="text-sm text-zinc-600 dark:text-[#e7e9ea] italic">
          {world.state.summary}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-zinc-500">{k}</span>{" "}
              <span className="font-mono text-zinc-800 dark:text-[#e7e9ea]">
                {v}
              </span>
            </div>
          ))}
        </div>
        {world.state.goals.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-[#e7e9ea]">
            {world.state.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        )}
      </section> */}

      <nav className="flex gap-2 border-b border-zinc-200 dark:border-[#38444d]">
        {(["feed", "events", "cast"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm capitalize ${
              tab === t
                ? "border-b-2 border-blue-500 text-white"
                : "text-zinc-600 dark:text-[#e7e9ea] hover:text-white"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "feed" && (
        <div className="space-y-4">
          <PostComposer
            value={postContent}
            onChange={setPostContent}
            onSubmit={submitPost}
            busy={busy}
          />

          <div className="space-y-3">
            {world.feed.map((p) => (
              <PostCard key={p.id} post={p} worldId={id} />
            ))}
          </div>

          <div className="rounded border border-zinc-200 dark:border-[#38444d] bg-white dark:bg-[#192734] p-3 space-y-2">
            <h3 className="text-sm font-semibold">Take an action</h3>
            <textarea
              className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-zinc-50 dark:bg-[#192734] p-2 text-sm text-zinc-900 dark:text-[#e7e9ea]"
              rows={2}
              placeholder="I invite the rival idol to my studio at midnight…"
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              disabled={busy}
            />
            <button
              className="rounded bg-[#1d9bf0] px-3 py-1.5 text-sm font-medium hover:bg-[#1a8cd8] disabled:opacity-50"
              onClick={submitAction}
              disabled={busy || !actionText.trim()}
            >
              Act
            </button>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Your next moves</h2>
              <Link
                className="text-sm font-bold text-[#1d9bf0] hover:underline"
                href={`/worlds/${id}/events`}
              >
                View history
              </Link>
            </div>
            <p className="mt-1 text-sm text-[#71767b]">
              Choose how you respond to opportunities, rivalries, and relationship turning points.
            </p>
          </div>
          {eventOutcome && (
            <section className="rounded-2xl border border-[#1d9bf0]/40 bg-[#192734] p-5">
              <div className="text-sm font-bold text-[#1d9bf0]">The story moves forward</div>
              <h3 className="mt-1 text-xl font-bold">You made your choice</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#e7e9ea]">{eventOutcome.narration}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(eventOutcome.statChanges).filter(([, value]) => value !== 0).map(([name, value]) => (
                  <div className="rounded-xl bg-[#101418] p-3 text-sm" key={name}>
                    <span className="text-[#71767b]">{name}</span>
                    <span className={value > 0 ? "ml-2 text-[#00ba7c]" : "ml-2 text-[#f91880]"}>{value > 0 ? `+${value}` : value}</span>
                  </div>
                ))}
                {eventOutcome.relationshipChanges.map((change) => (
                  <div className="rounded-xl bg-[#101418] p-3 text-sm" key={change.character}>
                    <span className="text-[#71767b]">{change.character}</span>
                    <span className={change.delta >= 0 ? "ml-2 text-[#00ba7c]" : "ml-2 text-[#f91880]"}>{change.delta >= 0 ? `+${change.delta}` : change.delta}</span>
                    <div className="mt-1 text-xs text-[#b8c0c7]">{change.note}</div>
                  </div>
                ))}
              </div>
              {eventOutcome.posts.length > 0 && (
                <div className="mt-4 border-t border-[#38444d] pt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#71767b]">What people are saying</div>
                  {eventOutcome.posts.slice(0, 3).map((post) => (
                    <p className="mt-2 text-sm" key={post.id}><b>{post.authorHandle}</b> {post.content}</p>
                  ))}
                </div>
              )}
              <button className="mt-5 rounded-full bg-[#1d9bf0] px-5 py-2 font-bold hover:bg-[#1a8cd8]" onClick={() => setEventOutcome(null)}>
                Continue
              </button>
            </section>
          )}
          {eventScenario && !eventOutcome && (
            <article className="rounded-2xl border border-[#38444d] bg-[#192734] p-5 shadow-2xl shadow-black/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] font-bold">
                    {initials(eventScenario.sourceName || "Offscript")}
                  </div>
                  <div>
                    <div className="font-bold">{eventScenario.sourceName || "An unexpected message"}</div>
                    <div className="text-sm text-[#71767b]">
                      {eventScenario.sourceHandle || ""} {eventScenario.context || "sent you something unexpected"}
                    </div>
                  </div>
                </div>
                <button
                  className="rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold hover:border-[#1d9bf0] disabled:opacity-50"
                  onClick={rerollScenario}
                  disabled={busy}
                >
                  ↻ Reroll
                </button>
              </div>
              {!editingScenario ? (
                <>
                  <h3 className="mt-6 text-2xl font-bold leading-tight">{eventScenario.title}</h3>
                  <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-[#e7e9ea]">{eventScenario.description}</p>
                  <div className="mt-6 text-sm font-bold text-[#71767b]">What do you do?</div>
                  <div className="mt-3 grid gap-3">
                    {eventScenario.choices.map((choice, index) => (
                      <button
                        key={`${eventScenario.id}-${index}`}
                        className="rounded-2xl border border-[#536471] p-4 text-left transition hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-50"
                        onClick={() => chooseEvent(choice.action)}
                        disabled={busy}
                      >
                        <div className="font-bold">{choice.label}</div>
                        <div className="mt-1 text-sm leading-6 text-[#b8c0c7]">{choice.action}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 border-t border-[#38444d] pt-4">
                    <label className="text-sm font-bold">Write your own response</label>
                    <textarea
                      className="mt-2 w-full resize-y rounded-xl border border-[#38444d] bg-[#101418] p-3 text-sm leading-6 outline-none focus:border-[#1d9bf0]"
                      rows={3}
                      placeholder="Write exactly what you say or do…"
                      value={customResponse}
                      onChange={(event) => setCustomResponse(event.target.value)}
                      disabled={busy}
                    />
                    <button
                      className="mt-2 w-full rounded-full border border-[#1d9bf0] px-4 py-2 text-sm font-bold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-50"
                      onClick={() => chooseEvent(customResponse)}
                      disabled={busy || !customResponse.trim()}
                    >
                      Send my response
                    </button>
                  </div>
                  <button className="mt-4 text-sm text-[#71767b] hover:text-white" onClick={() => setEditingScenario(true)}>
                    Edit scenario
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-5 text-sm font-bold text-[#1d9bf0]">Edit scenario</div>
                  <input className="mt-2 w-full rounded-xl border border-[#38444d] bg-[#101418] p-3 text-xl font-bold outline-none focus:border-[#1d9bf0]" value={eventScenario.title} onChange={(event) => updateScenario({ title: event.target.value })} disabled={busy} />
                  <textarea className="mt-3 min-h-40 w-full resize-y rounded-xl border border-[#38444d] bg-[#101418] p-3 text-sm leading-6 outline-none focus:border-[#1d9bf0]" value={eventScenario.description} onChange={(event) => updateScenario({ description: event.target.value })} disabled={busy} />
                  <div className="mt-3 grid gap-3">
                    {eventScenario.choices.map((choice, index) => (
                      <div className="rounded-xl border border-[#38444d] p-3" key={`${eventScenario.id}-edit-${index}`}>
                        <input className="w-full rounded-lg bg-[#101418] p-2 font-bold outline-none" value={choice.label} onChange={(event) => updateChoice(index, { label: event.target.value })} disabled={busy} />
                        <textarea className="mt-2 w-full resize-y rounded-lg bg-[#101418] p-2 text-sm leading-6 outline-none" rows={3} value={choice.action} onChange={(event) => updateChoice(index, { action: event.target.value })} disabled={busy} />
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-bold" onClick={() => setEditingScenario(false)}>Save changes</button>
                  <button className="ml-3 text-sm text-[#71767b] hover:text-white" onClick={() => setEditingScenario(false)}>Done</button>
                </>
              )}
            </article>
          )}
          {!busy && !eventScenario && !eventOutcome && (
            <div className="rounded-2xl border border-[#38444d] bg-[#192734] p-6 text-center text-sm text-[#71767b]">
              Looking for another complication…
            </div>
          )}
        </div>
      )}

      {tab === "cast" && (
        <div className="space-y-4">
          {world.player && (
            <Link
              className="block rounded border border-[#1d9bf0]/50 bg-[#1d9bf0]/10 p-3 hover:bg-[#1d9bf0]/20"
              href={`/worlds/${id}/profile/${world.player.id}`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1d9bf0]">Your profile</div>
              <div className="mt-1 font-medium">{world.player.name}</div>
              <div className="text-xs text-zinc-500">{world.player.handle} · View your X profile →</div>
            </Link>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
          {[...world.cast, ...world.stanAccounts].map((c) => {
            const rel = world.relationships.find((r) => r.characterId === c.id);
            return (
              <Link
                key={c.id}
                href={`/worlds/${id}/profile/${c.id}`}
                className="rounded border border-zinc-200 dark:border-[#38444d] bg-white dark:bg-[#192734] p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">
                      {c.handle} · {c.kind} · {c.role}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 dark:text-[#e7e9ea]">
                  {c.bio}
                </div>
                {rel && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500">Relationship</span>
                      <span className="font-mono">{rel.level}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-700 dark:text-[#e7e9ea]">
                        {rel.status}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded bg-zinc-800">
                      <div
                        className="h-1.5 rounded bg-blue-500"
                        style={{
                          width: `${Math.max(0, (rel.level + 100) / 2)}%`,
                        }}
                      />
                    </div>
                    {rel.note && (
                      <div className="text-xs italic text-zinc-500">
                        {rel.note}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
          </div>
        </div>
      )}
          </div>
        </section>
        <aside className="hidden w-81.25 shrink-0 space-y-4 px-6 py-3 xl:block">
          <div className="rounded-full bg-[#202327] px-4 py-3 text-sm text-[#71767b]">Search this world</div>
          <section className="rounded-2xl bg-[#1c2023] p-4">
            <h2 className="text-xl font-bold">World overview</h2>
            <p className="mt-4 text-sm leading-6 text-[#b8c0c7]">{world.state.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-[#71767b]">Turn</div><b>{world.turn}</b></div>
              <div><div className="text-[#71767b]">Posts</div><b>{world.feed.length}</b></div>
              <div><div className="text-[#71767b]">Events</div><b>{world.events.length}</b></div>
              <div><div className="text-[#71767b]">Cast</div><b>{world.cast.length + world.stanAccounts.length}</b></div>
            </div>
          </section>
          <section className="rounded-2xl bg-[#1c2023] p-4">
            <h2 className="text-xl font-bold">People in this world</h2>
            {[...world.cast, ...world.stanAccounts].slice(0, 4).map((character) => (
              <Link className="mt-4 flex items-center gap-3" href={`/worlds/${id}/profile/${character.id}`} key={character.id}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold">{initials(character.name)}</div>
                <div className="min-w-0"><div className="truncate font-bold">{character.name}</div><div className="truncate text-sm text-[#71767b]">{character.handle}</div></div>
              </Link>
            ))}
            <button className="mt-5 text-sm text-[#1d9bf0]" onClick={() => setTab("cast")}>View all profiles</button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function PostComposer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded border border-zinc-200 dark:border-[#38444d] bg-white dark:bg-[#192734] p-3 space-y-2">
      <textarea
        className="w-full rounded border border-zinc-300 dark:border-[#38444d] bg-zinc-50 dark:bg-[#192734] p-2 text-sm text-zinc-900 dark:text-[#e7e9ea]"
        rows={3}
        placeholder="What do you want to post?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={busy}
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded bg-[#1d9bf0] px-3 py-1.5 text-sm font-medium hover:bg-[#1a8cd8] disabled:opacity-50"
          onClick={onSubmit}
          disabled={busy || !value.trim()}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, worldId }: { post: Post; worldId: number }) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);

  return (
    <article className="border-b border-[#2f3336] px-4 py-5 transition-colors hover:bg-white/[0.03]">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold text-white">{initials(post.authorName)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]"><b>{post.authorName}</b><span className="text-[#71767b]">{post.authorHandle} · turn {post.turn}</span><button className="ml-auto text-[#71767b]">•••</button></div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">{post.content}</p>
          <div className="mt-4 flex max-w-md justify-between text-[#71767b]">
            <Link aria-label="Reply" className="group flex items-center gap-2 text-sm hover:text-[#1d9bf0]" href={`/worlds/${worldId}/status/${post.id}`}><span className="text-lg">◯</span><span>{post.replyCount}</span></Link>
            <button aria-label="Repost" className={`group flex items-center gap-2 text-sm hover:text-[#00ba7c] ${reposted ? "text-[#00ba7c]" : ""}`} onClick={() => setReposted(!reposted)}><span className="text-lg">↻</span><span>{reposted ? 1 : 0}</span></button>
            <button aria-label="Like" className={`group flex items-center gap-2 text-sm hover:text-[#f91880] ${liked ? "text-[#f91880]" : ""}`} onClick={() => setLiked(!liked)}><span className="text-lg">{liked ? "♥" : "♡"}</span><span>{post.likes + (liked ? 1 : 0)}</span></button>
            <button aria-label="Share" className="text-lg hover:text-[#1d9bf0]">⌁</button>
          </div>
        </div>
      </div>
    </article>
  );
}
