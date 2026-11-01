"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import type { Character, World } from "@/lib/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CharacterProfilePage() {
  const params = useParams<{ id: string; characterId: string }>();
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .world(Number(params.id))
      .then(setWorld)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Failed to load profile",
        ),
      );
  }, [params.id]);

  const character = useMemo<Character | null>(() => {
    if (!world) return null;
    return (
      [world.player, ...world.cast, ...world.stanAccounts].find(
        (item): item is Character =>
          item !== null && item.id === Number(params.characterId),
      ) ?? null
    );
  }, [params.characterId, world]);

  if (error)
    return (
      <main className="min-h-screen bg-[#0f1419] p-8 text-red-300">
        {error}
      </main>
    );
  if (!world || !character)
    return (
      <main className="min-h-screen bg-[#0f1419] p-8 text-[#71767b]">
        Loading profile…
      </main>
    );

  const posts = world.feed.filter((post) => post.characterId === character.id);
  const relationship = world.relationships.find(
    (item) => item.characterId === character.id,
  );
  const isPlayer = character.id === world.player?.id;

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-58.75 shrink-0 flex-col px-4 py-3 lg:flex">
          <Link
            className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]"
            href={`/worlds/${world.id}`}
          >
            𝕏
          </Link>
          <nav className="space-y-1">
            <Link
              className="block rounded-full px-4 py-3 text-lg hover:bg-white/10"
              href={`/worlds/${world.id}`}
            >
              ⌂ <span className="ml-3">Home</span>
            </Link>
            <Link
              className="block rounded-full px-4 py-3 text-lg hover:bg-white/10"
              href={`/worlds/${world.id}/messages`}
            >
              ✉ <span className="ml-3">Messages</span>
            </Link>
            <Link
              className="block rounded-full px-4 py-3 text-lg font-bold hover:bg-white/10"
              href={`/worlds/${world.id}?tab=cast`}
            >
              ◎ <span className="ml-3">Profiles</span>
            </Link>
            <Link
              className="block rounded-full px-4 py-3 text-lg hover:bg-white/10"
              href={`/worlds/${world.id}?tab=events`}
            >
              ✦ <span className="ml-3">Events</span>
            </Link>
          </nav>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4">
            <div className="truncate font-bold">{world.playerName}</div>
            <div className="truncate text-sm text-[#71767b]">{world.name}</div>
            <ThemeToggle />
            <button
              className="text-sm text-[#71767b]"
              onClick={() => router.push("/")}
            >
              ← All worlds
            </button>
          </div>
        </aside>
        <section className="min-w-0 w-full max-w-150 border-x border-[#2f3336]">
          <header className="sticky top-0 z-10 flex items-center gap-7 border-b border-[#2f3336] bg-[#0f1419]/90 px-4 py-2 backdrop-blur-md">
            <Link
              aria-label="Back to world"
              className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-white/10"
              href={`/worlds/${world.id}`}
            >
              ←
            </Link>
            <div>
              <h1 className="font-bold">{character.name}</h1>
              <p className="text-xs text-[#71767b]">{posts.length} posts</p>
            </div>
          </header>
          <div className="h-44 bg-linear-to-r from-[#182c48] via-[#43245e] to-[#143f4b]" />
          <section className="relative border-b border-[#2f3336] px-4 pb-5">
            <div className="-mt-12 flex items-end justify-between">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-linear-to-br from-[#1d9bf0] to-[#7856ff] text-2xl font-bold ring-4 ring-[#0f1419]">
                {initials(character.name)}
              </div>
              {!isPlayer && (
                <Link
                  className="rounded-full border border-[#536471] px-5 py-2 font-bold hover:bg-white/10"
                  href={`/worlds/${world.id}`}
                >
                  Message
                </Link>
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold">{character.name}</h2>
            <p className="text-[#71767b]">{character.handle}</p>
            <p className="mt-4 leading-6">
              {character.bio || character.publicPersona || "No bio yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#71767b]">
              <span>⌖ {character.role}</span>
              <span>◷ Joined this world</span>
            </div>
            <div className="mt-4 flex gap-5 text-sm">
              <span>
                <b>{posts.length}</b>{" "}
                <span className="text-[#71767b]">Posts</span>
              </span>
              <span>
                <b>{relationship?.level ?? 0}</b>{" "}
                <span className="text-[#71767b]">Relationship</span>
              </span>
            </div>
          </section>
          <div className="grid grid-cols-3 border-b border-[#2f3336]">
            <button className="relative py-4 text-sm font-bold">
              Posts
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
            </button>
            <button className="py-4 text-sm font-bold text-[#71767b]">
              Replies
            </button>
            <button className="py-4 text-sm font-bold text-[#71767b]">
              Media
            </button>
          </div>
          {posts.length ? (
            posts.map((post) => (
              <article className="border-b border-[#2f3336] p-4" key={post.id}>
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#1d9bf0] to-[#7856ff] text-xs font-bold">
                    {initials(character.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p>
                      <b>{character.name}</b>{" "}
                      <span className="text-[#71767b]">
                        {character.handle} · turn {post.turn}
                      </span>
                    </p>
                    <p className="mt-1 leading-6">{post.content}</p>
                    <div className="mt-4 flex max-w-md justify-between text-sm text-[#71767b]">
                      <span>♡ {post.replyCount}</span>
                      <span>↻</span>
                      <span>♡ {post.likes}</span>
                      <span>▱</span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-10 text-center text-[#71767b]">No posts yet.</div>
          )}
        </section>
        <aside className="hidden w-81.25 space-y-4 px-6 py-3 xl:block">
          <div className="rounded-full bg-[#202327] px-4 py-3 text-sm text-[#71767b]">
            Search this world
          </div>
          <section className="rounded-2xl bg-[#1c2023] p-4">
            <h2 className="text-xl font-bold">World overview</h2>
            <p className="mt-3 text-sm leading-6 text-[#b8c0c7]">
              {world.state.summary}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[#71767b]">Turn</div>
                <b>{world.turn}</b>
              </div>
              <div>
                <div className="text-[#71767b]">Posts</div>
                <b>{world.feed.length}</b>
              </div>
              <div>
                <div className="text-[#71767b]">Events</div>
                <b>{world.events.length}</b>
              </div>
              <div>
                <div className="text-[#71767b]">Cast</div>
                <b>{world.cast.length + world.stanAccounts.length}</b>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
