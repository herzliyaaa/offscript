"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { ArrowLeftIcon, HeartIcon, MailIcon, SendIcon, TypingDots, ZapIcon } from "@/components/ui/Icons";
import WorldNav from "../WorldNav";
import type { Conversation, DirectMessage, Relationship, World } from "@/lib/types";
import { canAfford, energyCostHint } from "@/lib/energy";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessagesClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChar, setActiveChar] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [dmText, setDmText] = useState("");
  const [typingChar, setTypingChar] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [relationshipDelta, setRelationshipDelta] = useState<number | null>(null);
  const [activeRelationship, setActiveRelationship] = useState<Relationship | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (characterId: number) => {
    try {
      const result = await api.dms(id, characterId);
      setMessages([...result.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    } catch {
      setMessages([]);
    }
  }, [id]);

  const loadConversations = useCallback(async () => {
    const result = await api.conversations(id);
    setConversations(result);
    return result;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.world(id), api.conversations(id)])
      .then(([nextWorld, nextConversations]) => {
        if (cancelled) return;
        setWorld(nextWorld);
        setConversations(nextConversations);
        const saved = window.localStorage.getItem(`offscript:last-dm:${id}`);
        const selected = nextConversations.find((item) => item.character.id === Number(saved))
          ?? [...nextConversations].sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""))[0];
        if (selected) setActiveChar(selected.character.id);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to load messages");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!activeChar) return;
    window.localStorage.setItem(`offscript:last-dm:${id}`, String(activeChar));
    let cancelled = false;
    api.dms(id, activeChar)
      .then((result) => {
        if (cancelled) return;
        setMessages([...result.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeChar, id]);

  function selectConversation(characterId: number) {
    if (characterId === activeChar) return;
    setActiveChar(characterId);
    setRelationshipDelta(null);
    setActiveRelationship(null);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typingChar]);

  async function submitDm() {
    if (!activeChar || !dmText.trim() || busy || !canAfford(world?.energy, "message")) return;
    const content = dmText.trim();
    const optimisticId = -Date.now();
    setMessages((current) => [...current, {
      id: optimisticId, worldId: id, characterId: activeChar, sender: "player",
      content, turn: world?.turn ?? 0, read: true, createdAt: new Date().toISOString(),
    }]);
    setDmText("");
    setTypingChar(activeChar);
    setBusy(true);
    setError("");
    try {
      const result = await api.sendDm(id, activeChar, content);
      setRelationshipDelta(result.relationshipDelta);
      setActiveRelationship(result.relationship);
      if (result.energy) {
        setWorld((current) => current ? { ...current, energy: result.energy } : current);
      }
      await loadMessages(activeChar);
      await loadConversations();
    } catch (reason) {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setError(reason instanceof Error ? reason.message : "Failed to send message");
    } finally {
      setTypingChar(null);
      setBusy(false);
    }
  }

  if (!world) return <LoadingState label="Loading messages…" />;
  const conversation = conversations.find((item) => item.character.id === activeChar);
  const character = conversation?.character;
  const relationship = activeRelationship ?? conversation?.relationship ?? null;
  const canSend = canAfford(world.energy, "message");

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={id}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active="messages"
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="flex h-[calc(100dvh-4rem)] w-full max-w-[1000px] flex-col border-x border-line lg:h-screen">
          <header className="border-b border-line px-5 py-4">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <p className="mt-0.5 text-[13px] text-muted">Private conversations in {world.name}</p>
          </header>

          {error && (
            <div className="border-b border-danger/30 bg-danger/10 px-5 py-3 text-sm text-danger animate-fade-in">{error}</div>
          )}

          <div className="grid min-h-0 flex-1 md:grid-cols-[290px_1fr]">
            {/* Conversation list */}
            <div
              className={`min-h-0 overflow-y-auto border-line p-3 md:border-r ${activeChar ? "hidden md:block" : "block"}`}
            >
              {conversations.map((item) => {
                const isActive = activeChar === item.character.id;
                return (
                  <button
                    className={`focus-ring mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      isActive ? "bg-accent/10" : "hover:bg-foreground/[0.05]"
                    }`}
                    key={item.character.id}
                    onClick={() => selectConversation(item.character.id)}
                  >
                    <Avatar name={item.character.name} src={item.character.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-bold">{item.character.name}</div>
                        {item.lastMessage && (
                          <div className="shrink-0 text-[10px] font-medium tabular-nums text-subtle">
                            {formatTime(item.lastMessage.createdAt)}
                          </div>
                        )}
                      </div>
                      <div className="truncate text-xs text-subtle">
                        {item.lastMessage?.content ?? item.character.handle}
                      </div>
                    </div>
                    {item.unreadCount > 0 && (
                      <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1.5 text-[10px] font-bold text-white">
                        {item.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <p className="p-6 text-center text-sm text-subtle">No conversations yet.</p>
              )}
            </div>

            {/* Chat pane */}
            <div className={`min-h-0 flex-col ${activeChar ? "flex" : "hidden md:flex"}`}>
              {character ? (
                <>
                  <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <button
                      className="icon-btn h-9 w-9 md:hidden"
                      onClick={() => setActiveChar(null)}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeftIcon size={18} />
                    </button>
                    <Avatar name={character.name} src={character.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold leading-tight">{character.name}</div>
                      <div className="truncate text-xs text-subtle">{character.handle}</div>
                    </div>
                    <Link
                      className="focus-ring shrink-0 rounded-full border border-line px-4 py-1.5 text-xs font-bold text-muted transition-all hover:border-accent hover:text-accent"
                      href={`/worlds/${id}/profile/${character.id}`}
                    >
                      Profile
                    </Link>
                  </header>

                  <div className="border-b border-line px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-subtle">
                        <HeartIcon size={12} /> Relationship
                      </span>
                      {relationship ? (
                        <span className="capitalize text-muted">
                          <b className={`font-bold ${relationship.level >= 60 ? "text-success" : relationship.level < 0 ? "text-danger" : "text-accent"}`}>
                            {relationship.status}
                          </b>{" "}
                          · {relationship.level}/100
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </div>
                    {relationship && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ${
                            relationship.level < 0
                              ? "bg-gradient-to-r from-rose-500 to-red-400"
                              : relationship.level >= 60
                                ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                                : "bg-gradient-to-r from-indigo-400 to-violet-400"
                          }`}
                          style={{ width: `${Math.max(2, Math.min(100, ((relationship.level + 100) / 2)))}%` }}
                        />
                      </div>
                    )}
                    {relationshipDelta !== null && relationshipDelta !== 0 && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold animate-pop ${
                          relationshipDelta > 0 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                        }`}
                        role="status"
                        aria-live="polite"
                      >
                        {relationshipDelta > 0 ? "↑" : "↓"} {Math.abs(relationshipDelta)}
                      </div>
                    )}
                  </div>

                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
                    {messages.map((message, index) => {
                      const isPlayer = message.sender === "player";
                      const prev = messages[index - 1];
                      const grouped = prev && prev.sender === message.sender;
                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${isPlayer ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-3"}`}
                        >
                          {!isPlayer && (
                            <span className={grouped ? "w-8 shrink-0" : "shrink-0"}>
                              {!grouped && <Avatar name={character.name} src={character.avatarUrl} size="xs" />}
                            </span>
                          )}
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed animate-slide-up ${
                              isPlayer
                                ? "rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_2px_12px_rgba(139,92,246,0.3)]"
                                : "rounded-bl-md border border-line bg-surface-2"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className={`mt-0.5 text-[10px] tabular-nums ${isPlayer ? "text-white/60" : "text-subtle"}`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {typingChar === activeChar && (
                      <div className="mt-3 flex items-end gap-2" aria-live="polite">
                        <Avatar name={character.name} src={character.avatarUrl} size="xs" />
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
                          <TypingDots />
                          <span className="text-xs">{character.name} is typing</span>
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  <div className="border-t border-line p-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2/60 p-1.5 pl-4 transition-shadow focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
                        value={dmText}
                        onChange={(event) => setDmText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") submitDm();
                        }}
                        placeholder="Start a new message…"
                        disabled={busy}
                        aria-label="Message"
                      />
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                          canSend
                            ? "border-line bg-surface-2/60 text-subtle"
                            : "border-danger/40 bg-danger/10 text-danger"
                        }`}
                        title="Energy cost of a direct message"
                      >
                        <ZapIcon size={11} /> {energyCostHint(world.energy, "message")}
                      </span>
                      <Button
                        size="sm"
                        className="h-9 rounded-xl px-4"
                        onClick={submitDm}
                        disabled={busy || !dmText.trim() || !canSend}
                        icon={<SendIcon size={14} />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid flex-1 place-items-center p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-subtle">
                    <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
                      <MailIcon size={28} />
                    </span>
                    <p className="font-semibold text-muted">Select a conversation</p>
                    <p className="max-w-xs text-sm">Your DMs are part of the story — characters remember what you say.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
