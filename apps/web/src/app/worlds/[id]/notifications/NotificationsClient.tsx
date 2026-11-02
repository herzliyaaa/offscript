"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingState from "@/components/LoadingState";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";

export default function NotificationsClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [worldName, setWorldName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.world(id), api.notifications(id)])
      .then(([world, result]) => {
        setWorldName(world.name);
        setNotifications(result.notifications);
        return api.markNotificationsRead(id);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load notifications"));
  }, [id]);

  if (error) return <main className="min-h-screen bg-[#0f1419] p-8 text-red-300">{error}</main>;
  if (!worldName) return <LoadingState label="Loading notifications…" />;

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#e7e9ea]">
      <div className="mx-auto flex min-h-screen max-w-[960px]">
        <aside className="hidden w-[235px] shrink-0 flex-col px-4 py-3 lg:flex">
          <Link className="mb-5 grid h-12 w-12 place-items-center rounded-full text-3xl font-black text-[#1d9bf0]" href={`/worlds/${id}`}>𝕏</Link>
          <nav className="space-y-1">
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}`}>⌂ <span className="ml-3">Home</span></Link>
            <Link className="block rounded-full bg-white/10 px-4 py-3 text-lg font-bold" href={`/worlds/${id}/notifications`}>♢ <span className="ml-3">Notifications</span></Link>
            <Link className="block rounded-full px-4 py-3 text-lg hover:bg-white/10" href={`/worlds/${id}/messages`}>✉ <span className="ml-3">Messages</span></Link>
          </nav>
          <div className="mt-auto space-y-2 border-t border-[#2f3336] pt-4"><div className="truncate text-sm font-bold">{worldName}</div><ThemeToggle /><button className="text-sm text-[#71767b]" onClick={() => router.push("/")}>← All worlds</button></div>
        </aside>
        <section className="w-full max-w-[720px] border-x border-[#2f3336]">
          <header className="border-b border-[#2f3336] px-5 py-4"><h1 className="text-xl font-bold">Notifications</h1><p className="text-sm text-[#71767b]">Updates from your world</p></header>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-[#71767b]">No notifications yet.</div>
          ) : notifications.map((notification) => (
            <Link key={notification.id} href={notification.href ?? `/worlds/${id}`} className="block border-b border-[#2f3336] px-5 py-4 hover:bg-white/[0.03]">
              <div className="flex gap-3"><span className="mt-1 text-xl text-[#1d9bf0]">{notification.type === "message" ? "✉" : notification.type === "relationship" ? "♡" : "✦"}</span><div><div className="font-bold">{notification.title}</div><p className="mt-1 text-sm text-[#b8c0c7]">{notification.body}</p><time className="mt-2 block text-xs text-[#71767b]">{new Date(notification.createdAt).toLocaleString()}</time></div></div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
