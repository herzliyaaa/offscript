"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { AppLogo, Wordmark } from "@/components/AppLogo";
import Avatar from "@/components/ui/Avatar";
import { ArrowLeftIcon, BellIcon, HomeIcon, MailIcon, SparklesIcon, UsersIcon } from "@/components/ui/Icons";
import EnergyMeter from "./EnergyMeter";
import type { WorldEnergy } from "@/lib/types";

export type WorldNavKey = "home" | "notifications" | "messages" | "cast" | "events";

const navItems: { key: WorldNavKey; label: string; icon: (props: { size?: number }) => React.ReactNode; href: (id: number) => string }[] = [
  { key: "home", label: "Home", icon: HomeIcon, href: (id) => `/worlds/${id}?tab=feed` },
  { key: "messages", label: "Messages", icon: MailIcon, href: (id) => `/worlds/${id}/messages` },
  { key: "notifications", label: "Notifications", icon: BellIcon, href: (id) => `/worlds/${id}/notifications` },
  { key: "cast", label: "Cast", icon: UsersIcon, href: (id) => `/worlds/${id}?tab=cast` },
  { key: "events", label: "Events", icon: SparklesIcon, href: (id) => `/worlds/${id}?tab=events` },
];

type WorldNavProps = {
  worldId: number;
  worldName: string;
  playerName?: string;
  playerAvatarUrl?: string | null;
  active: WorldNavKey;
  unreadNotifications?: number;
  energy?: WorldEnergy;
};

/**
 * Unified world navigation: a desktop rail, a mobile bottom tab bar,
 * and the signed-in player card. Shared by every world page.
 */
export default function WorldNav({
  worldId,
  worldName,
  playerName,
  playerAvatarUrl,
  active,
  unreadNotifications = 0,
  energy,
}: WorldNavProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col px-4 py-6 lg:flex">
        <Link href="/" className="focus-ring mb-8 flex items-center gap-3 rounded-2xl">
          <AppLogo size={42} />
          <Wordmark className="text-xl" />
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ key, label, icon: ItemIcon, href }) => {
            const isActive = active === key;
            return (
              <Link
                key={key}
                href={href(worldId)}
                className={`focus-ring relative flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] transition-all duration-200 ${
                  isActive
                    ? "bg-accent/10 font-bold text-foreground"
                    : "text-muted hover:bg-foreground/[0.05] hover:text-foreground"
                }`}
              >
                <span aria-hidden="true" className={isActive ? "text-accent" : ""}>
                  <ItemIcon size={22} />
                </span>
                <span>{label}</span>
                {key === "notifications" && unreadNotifications > 0 && (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-fuchsia-400"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href={`/worlds/${worldId}?tab=feed`}
          className="focus-ring mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_6px_24px_rgba(139,92,246,0.55)] active:scale-[0.98]"
        >
          Post
        </Link>

        {energy && (
          <div className="mt-4">
            <EnergyMeter energy={energy} variant="rail" />
          </div>
        )}

        <div className="mt-auto space-y-3 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <Avatar name={playerName ?? worldName} src={playerAvatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{playerName ?? "Player"}</div>
              <div className="truncate text-xs text-subtle">{worldName}</div>
            </div>
            <ThemeToggle />
          </div>
          <Link
            href="/"
            className="focus-ring flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon size={13} /> All worlds
          </Link>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden"
        aria-label="World navigation"
      >
        {navItems.map(({ key, label, icon: ItemIcon, href }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={href(worldId)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`focus-ring relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                isActive ? "text-accent" : "text-subtle hover:text-foreground"
              }`}
            >
              <span className="relative">
                <ItemIcon size={22} />
                {key === "notifications" && unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1 text-[9px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
