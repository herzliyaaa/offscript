"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { HeartIcon, MoreIcon, QuoteIcon, ReplyIcon, RepostIcon, ZapIcon } from "@/components/ui/Icons";
import AiActionModal from "./AiActionModal";
import type { Post, World, WorldEnergy } from "@/lib/types";
import { api } from "@/lib/api";
import { canAfford, energyCostHint } from "@/lib/energy";

function PostComposer({
  world,
  value,
  onChange,
  onSubmit,
  busy,
}: {
  world: World;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const remaining = 280 - value.length;
  const affordable = canAfford(world.energy, "post");
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex gap-3">
        <Avatar name={world.playerName} src={world.player?.avatarUrl ?? null} />
        <div className="min-w-0 flex-1 space-y-3">
          <Textarea
            rows={3}
            placeholder="What's happening in your world?"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={busy}
            className="min-h-[72px] border-0 bg-transparent !px-0 !py-0 text-base focus:!bg-transparent focus:!shadow-none"
          />
          <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
            <span
              className={`text-xs font-semibold tabular-nums ${
                remaining < 0 ? "text-danger" : remaining <= 20 ? "text-warning" : "text-subtle"
              }`}
            >
              {remaining}
            </span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                affordable
                  ? "border-line bg-surface-2/60 text-subtle"
                  : "border-danger/40 bg-danger/10 text-danger"
              }`}
              title="Energy cost of posting"
            >
              <ZapIcon size={11} /> {energyCostHint(world.energy, "post")}
            </span>
            <Button onClick={onSubmit} disabled={busy || !value.trim() || remaining < 0 || !affordable}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  worldId,
  onChanged,
  energy,
}: {
  post: Post;
  worldId: number;
  onChanged: () => Promise<void>;
  energy?: WorldEnergy;
}) {
  const [liked, setLiked] = useState(post.liked);
  const [reposted, setReposted] = useState(post.reposted);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const canQuote = canAfford(energy, "reply");

  async function toggle(type: "like" | "repost") {
    const result = await api.interactWithPost(worldId, post.id, type);
    if (type === "like") setLiked(result.active);
    else setReposted(result.active);
  }

  async function quote() {
    const content = window.prompt("Add a comment to your quote");
    if (!content?.trim()) return;
    setQuoteBusy(true);
    try {
      await api.createPost(worldId, content.trim(), undefined, post.id);
      await onChanged();
    } finally {
      setQuoteBusy(false);
    }
  }

  return (
    <article className="group/post relative cursor-default px-4 py-4 transition-colors sm:px-5 hover:bg-foreground/[0.025] animate-fade-in">
      <span className="absolute inset-y-0 left-0 w-1 scale-y-0 rounded-full bg-gradient-to-b from-indigo-400 to-fuchsia-400 transition-transform duration-300 group-hover/post:scale-y-100" aria-hidden="true" />
      <div className="flex gap-3">
        <Avatar name={post.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px]">
            <b className="truncate font-bold">{post.authorName}</b>
            <span className="truncate text-[13px] text-subtle">
              {post.authorHandle} · turn {post.turn}
            </span>
            <button className="icon-btn ml-auto h-8 w-8 shrink-0" aria-label="More options">
              <MoreIcon size={17} />
            </button>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
          <div className="mt-3 flex max-w-md items-center justify-between text-subtle">
            <Link
              aria-label={`Reply — ${post.replyCount} replies`}
              className="icon-btn group h-9 w-16 gap-1 rounded-full !px-0 text-xs hover:!text-accent"
              href={`/worlds/${worldId}/status/${post.id}`}
            >
              <ReplyIcon size={17} />
              <span className="tabular-nums">{post.replyCount}</span>
            </Link>
            <button
              aria-label="Repost"
              className={`icon-btn group h-9 w-16 gap-1 rounded-full !px-0 text-xs hover:!text-success ${reposted ? "!text-success" : ""}`}
              onClick={() => void toggle("repost")}
            >
              <RepostIcon size={17} className={reposted ? "animate-pop" : ""} />
              <span className="tabular-nums">{(post.repostCount ?? 0) + (reposted ? 1 : 0)}</span>
            </button>
            <button
              aria-label="Like"
              className={`icon-btn group h-9 w-16 gap-1 rounded-full !px-0 text-xs hover:!text-like ${liked ? "!text-like" : ""}`}
              onClick={() => void toggle("like")}
            >
              <HeartIcon size={17} filled={liked} className={liked ? "animate-pop" : ""} />
              <span className="tabular-nums">{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button
              aria-label="Quote post"
              className="icon-btn h-9 w-16 rounded-full !px-0 text-xs hover:!text-accent"
              onClick={() => void quote()}
              disabled={quoteBusy || !canQuote}
              title={canQuote ? `Quote costs ${energyCostHint(energy, "reply")}` : "Not enough energy to quote"}
            >
              <QuoteIcon size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FeedTab({
  world,
  worldId,
  postContent,
  setPostContent,
  actionText,
  setActionText,
  onSubmitPost,
  onSubmitAction,
  onChanged,
  busy,
}: {
  world: World;
  worldId: number;
  postContent: string;
  setPostContent: (value: string) => void;
  actionText: string;
  setActionText: (value: string) => void;
  onSubmitPost: () => void;
  onSubmitAction: () => void;
  onChanged: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="glass-card divide-y divide-line overflow-hidden">
        <PostComposer world={world} value={postContent} onChange={setPostContent} onSubmit={onSubmitPost} busy={busy} />
        {world.feed.map((post) => (
          <PostCard key={post.id} post={post} worldId={worldId} onChanged={onChanged} energy={world.energy} />
        ))}
        {world.feed.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <ZapIcon size={28} className="text-accent" />
            <p className="font-semibold">Your feed is quiet</p>
            <p className="text-sm text-muted">Post something and watch the world react.</p>
          </div>
        )}
      </div>
      <AiActionModal value={actionText} onChange={setActionText} onSubmit={onSubmitAction} busy={busy} energy={world.energy} />
    </div>
  );
}
