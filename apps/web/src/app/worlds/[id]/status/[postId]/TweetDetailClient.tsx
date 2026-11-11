"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { ArrowLeftIcon, HeartIcon, ReplyIcon, ZapIcon } from "@/components/ui/Icons";
import WorldNav from "../../WorldNav";
import type { Post, World } from "@/lib/types";
import { canAfford, energyCostHint } from "@/lib/energy";

export default function TweetDetailClient() {
  const params = useParams<{ id: string; postId: string }>();
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
    let cancelled = false;
    Promise.all([api.world(worldId), api.post(worldId, postId)])
      .then(([loadedWorld, loadedPost]) => {
        if (cancelled) return;
        setWorld(loadedWorld);
        setPost(loadedPost.post);
        setReplies(loadedPost.replies);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to load post");
      });
    return () => {
      cancelled = true;
    };
  }, [postId, worldId]);

  const author = useMemo(
    () => world && [...(world.player ? [world.player] : []), ...world.cast, ...world.stanAccounts]
      .find((character) => character.id === post?.characterId),
    [post?.characterId, world],
  );

  async function submitReply() {
    if (!reply.trim() || !canAfford(world?.energy, "reply")) return;
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

  if (error && !world) return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="glass-card max-w-md p-6 text-center text-sm text-danger">{error}</div>
    </main>
  );
  if (!world || !post) return <LoadingState label="Loading post…" />;
  const canReply = canAfford(world.energy, "reply");

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={worldId}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active="home"
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="w-full max-w-[680px] border-x border-line">
          <header className="sticky top-0 z-30 flex items-center gap-5 border-b border-line bg-background/75 px-4 py-3 backdrop-blur-xl">
            <Link
              aria-label="Back to world"
              className="icon-btn focus-ring h-9 w-9"
              href={`/worlds/${worldId}`}
            >
              <ArrowLeftIcon size={18} />
            </Link>
            <h1 className="font-bold tracking-tight">Post</h1>
          </header>

          {error && (
            <div className="border-b border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-fade-in">{error}</div>
          )}

          <article className="border-b border-line p-5 animate-fade-in">
            <div className="flex gap-3">
              <Avatar name={author?.name ?? post.authorName} src={author?.avatarUrl ?? null} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <b className="text-[15px] font-bold">{post.authorName}</b>
                  <span className="truncate text-[13px] text-subtle">
                    {post.authorHandle} · turn {post.turn}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-xl leading-relaxed">{post.content}</p>
                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-sm text-subtle">
                  <span className="flex items-center gap-1.5">
                    <HeartIcon size={15} className="text-like" />
                    <b className="tabular-nums text-foreground">{post.likes}</b> likes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ReplyIcon size={15} />
                    <b className="tabular-nums text-foreground">{post.replyCount}</b> replies
                  </span>
                </div>
              </div>
            </div>
          </article>

          <div className="border-b border-line p-5">
            <div className="flex gap-3">
              <Avatar name={world.playerName} src={world.player?.avatarUrl ?? null} />
              <div className="min-w-0 flex-1">
                <textarea
                  className="w-full resize-none bg-transparent text-base outline-none placeholder:text-subtle"
                  rows={2}
                  placeholder="Post your reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={busy}
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      canReply
                        ? "border-line bg-surface-2/60 text-subtle"
                        : "border-danger/40 bg-danger/10 text-danger"
                    }`}
                    title="Energy cost of replying"
                  >
                    <ZapIcon size={11} /> {energyCostHint(world.energy, "reply")}
                  </span>
                  <Button
                    size="sm"
                    onClick={submitReply}
                    disabled={busy || !reply.trim() || !canReply}
                    icon={<ReplyIcon size={13} />}
                  >
                    {busy ? "Posting…" : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {replies.map((item) => {
            const replyAuthor = [...(world.player ? [world.player] : []), ...world.cast, ...world.stanAccounts]
              .find((character) => character.id === item.characterId);
            return (
              <article className="border-b border-line p-5 transition-colors hover:bg-foreground/[0.025] animate-fade-in" key={item.id}>
                <div className="flex gap-3">
                  <Avatar name={replyAuthor?.name ?? item.authorName} src={replyAuthor?.avatarUrl ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <b className="text-[15px] font-bold">{item.authorName}</b>
                      <span className="truncate text-[13px] text-subtle">
                        {item.authorHandle} · turn {item.turn}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{item.content}</p>
                  </div>
                </div>
              </article>
            );
          })}
          {replies.length === 0 && (
            <div className="p-10 text-center text-sm text-subtle">No replies yet — start the conversation.</div>
          )}
        </section>
      </div>
    </main>
  );
}
