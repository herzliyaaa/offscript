"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingState from "@/components/LoadingState";
import { BellIcon, HeartIcon, MailIcon, SparklesIcon } from "@/components/ui/Icons";
import WorldNav from "../WorldNav";
import { api } from "@/lib/api";
import type { Notification, World } from "@/lib/types";

function notificationIcon(type: string) {
  if (type === "message") return { icon: MailIcon, tone: "text-accent from-indigo-500/15 to-violet-500/15" };
  if (type === "relationship") return { icon: HeartIcon, tone: "text-like from-pink-500/15 to-rose-500/15" };
  return { icon: SparklesIcon, tone: "text-warning from-amber-400/15 to-orange-400/15" };
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.world(id), api.notifications(id)])
      .then(([loadedWorld, result]) => {
        if (cancelled) return;
        setWorld(loadedWorld);
        setNotifications(result.notifications);
        return api.markNotificationsRead(id);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to load notifications");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-8">
        <div className="glass-card max-w-md p-6 text-center text-sm text-danger">{error}</div>
      </main>
    );
  }
  if (!world) return <LoadingState label="Loading notifications…" />;

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={id}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active="notifications"
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="w-full max-w-[680px] border-x border-line">
          <header className="sticky top-0 z-30 border-b border-line bg-background/75 px-5 py-4 backdrop-blur-xl">
            <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-0.5 text-[13px] text-muted">Updates from your world</p>
          </header>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-14 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-accent">
                <BellIcon size={28} />
              </span>
              <p className="font-semibold">All caught up</p>
              <p className="text-sm text-muted">When something happens in your world, it shows up here.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const { icon: ItemIcon, tone } = notificationIcon(notification.type);
              return (
                <Link
                  key={notification.id}
                  href={notification.href ?? `/worlds/${id}`}
                  className="group flex gap-3.5 border-b border-line px-5 py-4 transition-colors hover:bg-foreground/[0.03] animate-fade-in"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone}`}>
                    <ItemIcon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold leading-snug">{notification.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{notification.body}</p>
                    <time className="mt-1.5 block text-xs text-subtle" dateTime={notification.createdAt}>
                      {formatWhen(notification.createdAt)}
                    </time>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
