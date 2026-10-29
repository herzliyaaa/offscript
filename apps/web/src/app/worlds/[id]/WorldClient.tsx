'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type {
  Conversation,
  DirectMessage,
  Post,
  World,
} from '@/lib/types';

type Tab = 'feed' | 'dms' | 'events' | 'cast';

export default function WorldPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('feed');

  const [postContent, setPostContent] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [actionText, setActionText] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChar, setActiveChar] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [dmText, setDmText] = useState('');

  const [eventPrompt, setEventPrompt] = useState('');
  const [eventType, setEventType] = useState('');

  const loadWorld = useCallback(async () => {
    try {
      const w = await api.world(id);
      setWorld(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load world');
    }
  }, [id]);

  const loadConversations = useCallback(async () => {
    try {
      const c = await api.conversations(id);
      setConversations(c);
    } catch {
      // ignore
    }
  }, [id]);

  const loadMessages = useCallback(
    async (characterId: number) => {
      try {
        const r = await api.dms(id, characterId);
        setMessages(r.messages);
      } catch {
        setMessages([]);
      }
    },
    [id],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadWorld();
      setLoading(false);
    })();
  }, [loadWorld]);

  useEffect(() => {
    if (tab !== 'dms') return;
    let cancelled = false;
    (async () => {
      try {
        const c = await api.conversations(id);
        if (!cancelled) setConversations(c);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, id]);

  useEffect(() => {
    if (!activeChar) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.dms(id, activeChar);
        if (!cancelled) setMessages(r.messages);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChar, id]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitPost() {
    if (!postContent.trim()) return;
    await run(async () => {
      await api.createPost(id, postContent, replyTo ?? undefined);
      setPostContent('');
      setReplyTo(null);
      await loadWorld();
    });
  }

  async function submitDm() {
    if (!dmText.trim() || !activeChar) return;
    await run(async () => {
      await api.sendDm(id, activeChar, dmText);
      setDmText('');
      await loadMessages(activeChar);
      await loadConversations();
      await loadWorld();
    });
  }

  async function submitAction() {
    if (!actionText.trim()) return;
    await run(async () => {
      await api.act(id, actionText);
      setActionText('');
      await loadWorld();
    });
  }

  async function submitEvent() {
    await run(async () => {
      await api.generateEvent(id, eventType || undefined, eventPrompt || undefined);
      setEventPrompt('');
      setEventType('');
      await loadWorld();
    });
  }

  if (loading || !world) {
    return <div className="p-8 text-zinc-400">Loading world…</div>;
  }

  const stats = world.state.playerStats;

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{world.name}</h1>
          <p className="text-sm text-zinc-400">
            {world.playerName} · turn {world.turn} · {world.scenarioKey}
          </p>
        </div>
        <button
          className="text-sm text-zinc-400 hover:text-white"
          onClick={() => router.push('/')}
        >
          ← Home
        </button>
      </header>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {busy && (
        <div className="rounded border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-300">
          AI is thinking… this can take a minute or two.
        </div>
      )}

      <section className="rounded border border-zinc-800 bg-zinc-900 p-4 space-y-2">
        <div className="text-sm text-zinc-300">{world.state.currentScene}</div>
        <div className="text-sm text-zinc-400 italic">{world.state.summary}</div>
        <div className="flex flex-wrap gap-3 pt-2">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-zinc-500">{k}</span>{' '}
              <span className="font-mono text-zinc-200">{v}</span>
            </div>
          ))}
        </div>
        {world.state.goals.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-zinc-400">
            {world.state.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex gap-2 border-b border-zinc-800">
        {(['feed', 'dms', 'events', 'cast'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm capitalize ${
              tab === t
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'feed' && (
        <div className="space-y-4">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-2">
            <textarea
              className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
              rows={3}
              placeholder={
                replyTo
                  ? `Replying to post #${replyTo}…`
                  : 'What do you want to post?'
              }
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={busy}
            />
            <div className="flex items-center gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                onClick={submitPost}
                disabled={busy || !postContent.trim()}
              >
                {replyTo ? 'Reply' : 'Post'}
              </button>
              {replyTo && (
                <button
                  className="text-sm text-zinc-400 hover:text-white"
                  onClick={() => setReplyTo(null)}
                >
                  Cancel reply
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {world.feed.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onReply={() => setReplyTo(p.id)}
              />
            ))}
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-2">
            <h3 className="text-sm font-semibold">Take an action</h3>
            <textarea
              className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
              rows={2}
              placeholder="I invite the rival idol to my studio at midnight…"
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              disabled={busy}
            />
            <button
              className="rounded bg-purple-600 px-3 py-1.5 text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
              onClick={submitAction}
              disabled={busy || !actionText.trim()}
            >
              Act
            </button>
          </div>
        </div>
      )}

      {tab === 'dms' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-400">Conversations</h3>
            {conversations.map((c) => (
              <button
                key={c.character.id}
                className={`w-full rounded border p-2 text-left text-sm ${
                  activeChar === c.character.id
                    ? 'border-blue-500 bg-zinc-800'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
                onClick={() => setActiveChar(c.character.id)}
              >
                <div className="font-medium">{c.character.name}</div>
                <div className="text-xs text-zinc-500">
                  {c.character.handle}
                  {c.unreadCount > 0 && (
                    <span className="ml-2 rounded bg-blue-600 px-1.5 text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <div className="mt-1 truncate text-xs text-zinc-400">
                    {c.lastMessage.content}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="sm:col-span-2 space-y-3">
            {activeChar ? (
              <>
                <div className="h-80 overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                        m.sender === 'player'
                          ? 'ml-auto bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-100'
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
                    value={dmText}
                    onChange={(e) => setDmText(e.target.value)}
                    placeholder="Send a DM…"
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitDm();
                    }}
                  />
                  <button
                    className="rounded bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                    onClick={submitDm}
                    disabled={busy || !dmText.trim()}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">Select a conversation.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-2">
            <h3 className="text-sm font-semibold">Generate an event</h3>
            <div className="flex gap-2">
              <input
                className="w-40 rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
                placeholder="type (scandal, etc.)"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                disabled={busy}
              />
              <input
                className="flex-1 rounded border border-zinc-700 bg-zinc-950 p-2 text-sm"
                placeholder="optional prompt"
                value={eventPrompt}
                onChange={(e) => setEventPrompt(e.target.value)}
                disabled={busy}
              />
              <button
                className="rounded bg-orange-600 px-3 py-2 text-sm font-medium hover:bg-orange-500 disabled:opacity-50"
                onClick={submitEvent}
                disabled={busy}
              >
                Generate
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {world.events.map((e) => (
              <div
                key={e.id}
                className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-400">
                    {e.type}
                  </span>
                  <span className="font-medium">{e.title}</span>
                </div>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {e.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cast' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...world.cast, ...world.stanAccounts].map((c) => {
            const rel = world.relationships.find(
              (r) => r.characterId === c.id,
            );
            return (
              <div
                key={c.id}
                className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">
                      {c.handle} · {c.kind} · {c.role}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-400">{c.bio}</div>
                {rel && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500">Relationship</span>
                      <span className="font-mono">{rel.level}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
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
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function PostCard({
  post,
  onReply,
}: {
  post: Post;
  onReply: () => void;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-3 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-zinc-200">{post.authorHandle}</span>
        <span className="rounded bg-zinc-800 px-1.5 text-zinc-400">
          {post.kind}
        </span>
        <span className="text-zinc-500">♥ {post.likes}</span>
        {post.replyCount > 0 && (
          <span className="text-zinc-500">{post.replyCount} replies</span>
        )}
      </div>
      <div className="text-sm text-zinc-100 whitespace-pre-wrap">
        {post.content}
      </div>
      <button
        className="text-xs text-blue-400 hover:text-blue-300"
        onClick={onReply}
      >
        Reply
      </button>
    </div>
  );
}
