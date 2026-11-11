"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import type { World } from "@/lib/types";

type Tab = "feed" | "events" | "cast";

export default function WorldSidebar({
  id,
  world,
  onTabChange,
  side = "left",
}: {
  id: number;
  world: World;
  onTabChange: (tab: Tab) => void;
  side?: "left" | "right";
}) {
  function initials(name?: string) {
    return (name?.trim() || "?")
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  if (side === "right") {
    return (
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
          <button className="mt-5 text-sm text-[#1d9bf0]" onClick={() => onTabChange("cast")}>View all profiles</button>
        </section>
      </aside>
    );
  }

  return (
      <aside className="sticky top-0 hidden h-screen w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]">𝕏</div>
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg font-bold hover:bg-white/10" onClick={() => onTabChange("feed")}>⌂ <span>Home</span></button>
          <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => onTabChange("feed")}># <span>Explore</span></button>
          <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}/notifications`}>♢ <span className="ml-3">Notifications</span>{world.unreadNotifications > 0 && <span className="ml-2 rounded-full bg-[#1d9bf0] px-2 py-0.5 text-xs">{world.unreadNotifications}</span>}</Link>
          <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}/messages`}>✉ <span className="ml-3">Messages</span></Link>
          <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => onTabChange("cast")}>◎ <span>Profiles</span></button>
          <button className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-lg hover:bg-white/10" onClick={() => onTabChange("events")}>✦ <span>Events</span></button>
        </nav>
        <button className="mt-5 w-full rounded-full bg-[#1d9bf0] py-3 font-bold hover:bg-[#1a8cd8]" onClick={() => onTabChange("feed")}>Post</button>
        <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4">
          <div className="truncate text-sm font-bold">{world.playerName}</div>
          <div className="truncate text-xs text-[#71767b]">{world.name}</div>
          <ThemeToggle />
          <Link className="block text-sm text-[#71767b] hover:text-white" href="/">← All worlds</Link>
        </div>
      </aside>
  );
}
