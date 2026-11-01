"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingState from "@/components/LoadingState";
import type { Post, World } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function TweetDetailClient() {
  const params = useParams<{ id: string; postId: string }>();
  const router = useRouter();
  const worldId = Number(params.id);
  const postId = Number(params.postId);
  const [world, setWorld] = useState<World | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [loadedWorld, loadedPost] = await Promise.all([
        api.world(worldId),
        api.post(worldId, postId),
      ]);
      setWorld(loadedWorld);
      setPost(loadedPost.post);
      setReplies(loadedPost.replies);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to load post");
    }
  }, [postId, worldId]);

  useEffect(() => {
    load();
  }, [load]);

  const author = useMemo(
    () => world && [...(world.player ? [world.player] : []), ...world.cast, ...world.stanAccounts]
      .find((character) => character.id === post?.characterId),
    [post?.characterId, world],
  );

  async function submitReply() {
    if (!reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.createPost(worldId, reply, postId);
      setReply("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to post reply");
    } finally {
      setBusy(false);
    }
  }

  if (error && !world) return <main className="min-h-screen bg-[#0f1419] p-8 text-red-300">{error}</main>;
  if (!world || !post) return <LoadingState label="Loading post…" />;

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex min-h-screen max-w-[1280px]">
        <aside className="sticky top-0 hidden h-screen w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
          <Link className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]" href={`/worlds/${worldId}`}>𝕏</Link>
          <nav className="space-y-1">
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}`}>⌂ <span className="ml-3">Home</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}/messages`}>✉ <span className="ml-3">Messages</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}?tab=cast`}>◎ <span className="ml-3">Profiles</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${worldId}?tab=events`}>✦ <span className="ml-3">Events</span></Link>
          </nav>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4">
            <div className="truncate font-bold">{world.playerName}</div>
            <div className="truncate text-sm text-[#71767b]">{world.name}</div>
            <ThemeToggle />
            <button className="text-sm text-[#71767b]" onClick={() => router.push("/")}>← All worlds</button>
          </div>
        </aside>
        <section className="min-w-0 w-full max-w-[600px] border-x border-[#2f3336]">
          <header className="sticky top-0 z-10 flex items-center gap-7 border-b border-[#2f3336] bg-[#0f1419]/90 px-4 py-2 backdrop-blur-md">
            <Link aria-label="Back to world" className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-white/10" href={`/worlds/${worldId}`}>←</Link>
            <h1 className="font-bold">Post</h1>
          </header>
          {error && <div className="border-b border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <article className="border-b border-[#2f3336] p-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold">{initials(author?.name ?? post.authorName)}</div>
              <div className="min-w-0 flex-1">
                <div><b>{post.authorName}</b> <span className="text-[#71767b]">{post.authorHandle} · turn {post.turn}</span></div>
                <p className="mt-4 whitespace-pre-wrap text-xl leading-7">{post.content}</p>
                <div className="mt-4 border-t border-[#2f3336] pt-3 text-sm text-[#71767b]">{post.likes} Likes · {post.replyCount} Replies</div>
              </div>
            </div>
          </article>
          <div className="border-b border-[#2f3336] p-4">
            <textarea className="w-full resize-none bg-transparent text-lg outline-none" rows={3} placeholder="Post your reply" value={reply} onChange={(event) => setReply(event.target.value)} disabled={busy} />
            <div className="flex justify-end">
              <button className="flex items-center gap-2 rounded-full bg-[#1d9bf0] px-5 py-2 font-bold hover:bg-[#1a8cd8] disabled:opacity-50" onClick={submitReply} disabled={busy || !reply.trim()}>{busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />} {busy ? "Posting" : "Reply"}</button>
            </div>
          </div>
          {replies.map((item) => (
            <article className="border-b border-[#2f3336] p-4" key={item.id}>
              <div className="flex gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold">{initials(item.authorName)}</div>
                <div className="min-w-0 flex-1"><div><b>{item.authorName}</b> <span className="text-[#71767b]">{item.authorHandle} · turn {item.turn}</span></div><p className="mt-1 whitespace-pre-wrap leading-6">{item.content}</p></div>
              </div>
            </article>
          ))}
        </section>
        <aside className="hidden w-[325px] space-y-4 px-6 py-3 xl:block">
          <div className="rounded-full bg-[#202327] px-4 py-3 text-sm text-[#71767b]">Search this world</div>
          <section className="rounded-2xl bg-[#1c2023] p-4"><h2 className="text-xl font-bold">World overview</h2><p className="mt-3 text-sm leading-6 text-[#b8c0c7]">{world.state.summary}</p></section>
        </aside>
      </div>
    </main>
  );
}
