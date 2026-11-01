"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingState from "@/components/LoadingState";
import type { Conversation, DirectMessage, World } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function MessagesClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChar, setActiveChar] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [dmText, setDmText] = useState("");
  const [typingChar, setTypingChar] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    Promise.all([api.world(id), loadConversations()])
      .then(([nextWorld, nextConversations]) => {
        setWorld(nextWorld);
        const saved = window.localStorage.getItem(`offscript:last-dm:${id}`);
        const selected = nextConversations.find((item) => item.character.id === Number(saved))
          ?? [...nextConversations].sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""))[0];
        if (selected) setActiveChar(selected.character.id);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load messages"));
  }, [id, loadConversations]);

  useEffect(() => {
    if (!activeChar) return;
    window.localStorage.setItem(`offscript:last-dm:${id}`, String(activeChar));
    loadMessages(activeChar);
  }, [activeChar, id, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typingChar]);

  async function submitDm() {
    if (!activeChar || !dmText.trim() || busy) return;
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
      await api.sendDm(id, activeChar, content);
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

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex max-w-[1280px]">
        <aside className="sticky top-0 hidden h-screen w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
          <Link className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]" href={`/worlds/${id}`}>𝕏</Link>
          <nav className="space-y-1">
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}`}>⌂ <span className="ml-3">Home</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg font-bold hover:bg-white/10" href={`/worlds/${id}/messages`}>✉ <span className="ml-3">Messages</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}?tab=cast`}>◎ <span className="ml-3">Profiles</span></Link>
          </nav>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4"><div className="truncate font-bold">{world.playerName}</div><div className="truncate text-sm text-[#71767b]">{world.name}</div><ThemeToggle /><button className="text-sm text-[#71767b]" onClick={() => router.push("/")}>← All worlds</button></div>
        </aside>
        <section className="min-h-screen w-full max-w-[720px] border-x border-[#2f3336]">
          <header className="border-b border-[#2f3336] px-5 py-4"><h1 className="text-xl font-bold">Messages</h1><p className="text-sm text-[#71767b]">Private conversations in {world.name}</p></header>
          {error && <div className="border-b border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <div className="grid h-[calc(100vh-78px)] min-h-[520px] md:grid-cols-[230px_1fr]">
            <div className="max-h-full overflow-y-auto border-r border-[#2f3336] p-3">
              {conversations.map((item) => <button className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white/10 ${activeChar === item.character.id ? "bg-[#1d9bf0]/10" : ""}`} key={item.character.id} onClick={() => setActiveChar(item.character.id)}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold">{initials(item.character.name)}</div>
                <div className="min-w-0"><div className="truncate font-bold">{item.character.name}</div><div className="truncate text-xs text-[#71767b]">{item.lastMessage?.content ?? item.character.handle}</div></div>
              </button>)}
            </div>
            <div className="flex min-h-0 flex-col">
              {character ? <>
                <header className="flex items-center gap-3 border-b border-[#2f3336] p-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] font-bold">{initials(character.name)}</div><div><div className="font-bold">{character.name}</div><div className="text-sm text-[#71767b]">{character.handle}</div></div><Link className="ml-auto rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold" href={`/worlds/${id}/profile/${character.id}`}>Profile</Link></header>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {messages.map((message) => <div className={`mb-3 max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${message.sender === "player" ? "ml-auto bg-[#1d9bf0] text-white" : "bg-[#202327]"}`} key={message.id}>{message.content}</div>)}
                  {typingChar === activeChar && <div className="mb-3 w-fit rounded-2xl bg-[#202327] px-4 py-2 text-sm text-[#71767b]" aria-live="polite">{character.name} is typing <span className="animate-pulse">•••</span></div>}
                  <div ref={endRef} />
                </div>
                <div className="border-t border-[#2f3336] p-3"><div className="flex gap-2 rounded-full bg-[#202327] p-1.5"><input className="min-w-0 flex-1 bg-transparent px-4 outline-none" value={dmText} onChange={(event) => setDmText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitDm(); }} placeholder="Start a new message" disabled={busy} /><button className="flex min-w-16 items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-5 py-2 font-bold disabled:opacity-50" onClick={submitDm} disabled={busy || !dmText.trim()}>{busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />} {busy ? "Sending" : "Send"}</button></div></div>
              </> : <div className="grid flex-1 place-items-center p-8 text-center text-[#71767b]">Select a conversation to start messaging.</div>}
            </div>
          </div>
        </section>
        <aside className="hidden w-[325px] space-y-4 px-6 py-3 xl:block"><div className="rounded-2xl bg-[#1c2023] p-4"><h2 className="text-xl font-bold">Messages</h2><p className="mt-3 text-sm leading-6 text-[#71767b]">Your conversations are part of the story. Characters may answer differently as the world changes.</p></div></aside>
      </div>
    </main>
  );
}
