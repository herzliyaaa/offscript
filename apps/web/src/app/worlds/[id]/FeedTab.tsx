"use client";

import Link from "next/link";
import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import AiActionModal from "./AiActionModal";
import type { Post, World } from "@/lib/types";
import { api } from "@/lib/api";

function initials(name?: string) {
  return (name?.trim() || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function PostComposer({ value, onChange, onSubmit, busy }: { value: string; onChange: (value: string) => void; onSubmit: () => void; busy: boolean }) {
  return (
    <div className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-[#38444d] dark:bg-[#192734]">
      <Textarea rows={3} placeholder="What do you want to post?" value={value} onChange={(event) => onChange(event.target.value)} disabled={busy} />
      <Button onClick={onSubmit} disabled={busy || !value.trim()}>Post</Button>
    </div>
  );
}

function PostCard({ post, worldId, onChanged }: { post: Post; worldId: number; onChanged: () => Promise<void> }) {
  const [liked, setLiked] = useState(post.liked);
  const [reposted, setReposted] = useState(post.reposted);
  const [quoteBusy, setQuoteBusy] = useState(false);

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
    <article className="border-b border-[#2f3336] px-4 py-5 transition-colors hover:bg-white/[0.03]">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold text-white">{initials(post.authorName)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]"><b>{post.authorName}</b><span className="text-[#71767b]">{post.authorHandle} · turn {post.turn}</span><button className="ml-auto text-[#71767b]">•••</button></div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">{post.content}</p>
          <div className="mt-4 flex max-w-md justify-between text-[#71767b]">
            <Link aria-label="Reply" className="group flex items-center gap-2 text-sm hover:text-[#1d9bf0]" href={`/worlds/${worldId}/status/${post.id}`}><span className="text-lg">◯</span><span>{post.replyCount}</span></Link>
            <button aria-label="Repost" className={`group flex items-center gap-2 text-sm hover:text-[#00ba7c] ${reposted ? "text-[#00ba7c]" : ""}`} onClick={() => void toggle("repost")}><span className="text-lg">↻</span><span>{(post.repostCount ?? 0) + (reposted ? 1 : 0)}</span></button>
            <button aria-label="Like" className={`group flex items-center gap-2 text-sm hover:text-[#f91880] ${liked ? "text-[#f91880]" : ""}`} onClick={() => void toggle("like")}><span className="text-lg">{liked ? "♥" : "♡"}</span><span>{post.likes + (liked ? 1 : 0)}</span></button>
            <button aria-label="Quote post" className="text-lg hover:text-[#1d9bf0]" onClick={() => void quote()} disabled={quoteBusy}>⌁</button>
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
      <PostComposer value={postContent} onChange={setPostContent} onSubmit={onSubmitPost} busy={busy} />
      <div className="space-y-3">{world.feed.map((post) => <PostCard key={post.id} post={post} worldId={worldId} onChanged={onChanged} />)}</div>
      <AiActionModal value={actionText} onChange={setActionText} onSubmit={onSubmitAction} busy={busy} />
    </div>
  );
}
