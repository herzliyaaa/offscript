"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import {
  ArrowLeftIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  ReplyIcon,
} from "@/components/ui/Icons";
import WorldNav from "../../WorldNav";
import type { Character, UpdateCharacterInput, World } from "@/lib/types";

export default function CharacterProfilePage() {
  const params = useParams<{ id: string; characterId: string }>();
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UpdateCharacterInput>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
      <main className="grid min-h-screen place-items-center p-8">
        <div className="glass-card max-w-md p-6 text-center text-sm text-danger">{error}</div>
      </main>
    );
  if (!world || !character)
    return (
      <LoadingState label="Loading profile…" />
    );

  const posts = world.feed.filter((post) => post.characterId === character.id);
  const relationship = world.relationships.find(
    (item) => item.characterId === character.id,
  );
  const isPlayer = character.id === world.player?.id;
  const worldForProfile = world;
  const characterForProfile = character;

  function readAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_500_000) {
      setError("Choose an image smaller than 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, avatarUrl: String(reader.result) }));
    setAvatarFile(file);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const avatarUrl = avatarFile
        ? await api.uploadAvatar(avatarFile)
        : draft.avatarUrl;
      const updated = await api.updateCharacter(
        worldForProfile.id,
        characterForProfile.id,
        { ...draft, avatarUrl },
      );
      setWorld((current) => current ? {
        ...current,
        player: current.player?.id === updated.id ? { ...current.player, ...updated } : current.player,
        cast: current.cast.map((item) => item.id === updated.id ? { ...item, ...updated } : item),
      } : current);
      setEditing(false);
      setAvatarFile(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const relationshipLevel = relationship?.level ?? 0;

  return (
    <main className="min-h-screen pb-16 lg:pb-0">
      {saving && (
        <LoadingState label="Saving profile…" detail="Updating your character" overlay />
      )}
      <div className="mx-auto flex max-w-[1440px] justify-center">
        <WorldNav
          worldId={world.id}
          worldName={world.name}
          playerName={world.playerName}
          playerAvatarUrl={world.player?.avatarUrl ?? null}
          active="cast"
          unreadNotifications={world.unreadNotifications}
          energy={world.energy}
        />

        <section className="w-full max-w-[680px] border-x border-line">
          <header className="sticky top-0 z-30 flex items-center gap-5 border-b border-line bg-background/75 px-4 py-2.5 backdrop-blur-xl">
            <Link
              aria-label="Back to world"
              className="icon-btn focus-ring h-9 w-9"
              href={`/worlds/${world.id}`}
            >
              <ArrowLeftIcon size={18} />
            </Link>
            <div>
              <h1 className="font-bold leading-tight tracking-tight">{character.name}</h1>
              <p className="text-xs text-subtle">{posts.length} posts</p>
            </div>
          </header>

          <div className="relative h-44 bg-gradient-to-r from-[#2b1e5e] via-[#3b1d5c] to-[#123f52]">
            <span className="absolute inset-0 bg-[radial-gradient(600px_300px_at_80%_0%,rgba(139,124,248,0.35),transparent)]" aria-hidden="true" />
            <span className="absolute inset-0 bg-[radial-gradient(400px_240px_at_10%_100%,rgba(217,70,239,0.25),transparent)]" aria-hidden="true" />
          </div>

          <section className="relative border-b border-line px-5 pb-6">
            <div className="-mt-14 flex items-end justify-between gap-3">
              <span className="rounded-full bg-background p-1">
                <Avatar name={character.name} src={character.avatarUrl} size="xl" ring />
              </span>
              {isPlayer ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDraft({
                      name: character.name,
                      handle: character.handle,
                      gender: character.gender ?? undefined,
                      bio: character.bio,
                      additionalDescription: character.additionalDescription ?? undefined,
                      followerCount: character.followerCount,
                      avatarUrl: character.avatarUrl ?? undefined,
                    });
                    setEditing(true);
                  }}
                >
                  Edit profile
                </Button>
              ) : (
                <Link href={`/worlds/${world.id}/messages`}>
                  <Button variant="secondary" size="sm">Message</Button>
                </Link>
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{character.name}</h2>
            <p className="text-sm text-subtle">{character.handle}</p>
            <p className="mt-4 leading-relaxed">
              {character.bio || character.publicPersona || "No bio yet."}
            </p>
            {character.additionalDescription && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{character.additionalDescription}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-subtle">
              {character.role && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon size={14} /> {character.role}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarIcon size={14} /> Joined this world
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <span>
                <b className="tabular-nums">{posts.length}</b>{" "}
                <span className="text-subtle">Posts</span>
              </span>
              <span>
                <b className="tabular-nums">{character.followerCount.toLocaleString()}</b>{" "}
                <span className="text-subtle">Followers</span>
              </span>
              {relationship && (
                <span className="min-w-52">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-subtle">Relationship</span>
                    <b className={`capitalize ${relationshipLevel >= 60 ? "text-success" : relationshipLevel < 0 ? "text-danger" : "text-accent"}`}>
                      {relationship.status} · {relationship.level}/100
                    </b>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span
                      className={`block h-full rounded-full transition-[width] duration-700 ${
                        relationshipLevel < 0
                          ? "bg-gradient-to-r from-rose-500 to-red-400"
                          : relationshipLevel >= 60
                            ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                            : "bg-gradient-to-r from-indigo-400 to-violet-400"
                      }`}
                      style={{ width: `${Math.max(4, Math.min(100, ((relationship?.level ?? 0) + 100) / 2))}%` }}
                    />
                  </span>
                </span>
              )}
            </div>
          </section>

          {error && (
            <div className="border-b border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-fade-in">{error}</div>
          )}

          {editing && (
            <section className="border-b border-line p-5 animate-scale-in">
              <h2 className="flex items-center gap-2 font-bold tracking-tight">Edit your profile</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(["name", "handle", "gender", "followerCount", "bio", "additionalDescription"] as const).map((field) => (
                  <label className={field === "bio" || field === "additionalDescription" ? "block space-y-1.5 sm:col-span-2" : "block space-y-1.5"} key={field}>
                    <span className="text-sm font-medium text-muted">
                      {field === "followerCount" ? "Followers" : field}
                    </span>
                    {field === "bio" || field === "additionalDescription" ? (
                      <textarea
                        className="field"
                        rows={3}
                        value={String(draft[field] ?? "")}
                        onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                      />
                    ) : (
                      <input
                        type={field === "followerCount" ? "number" : "text"}
                        className="field"
                        value={String(draft[field] ?? "")}
                        onChange={(event) => setDraft({ ...draft, [field]: field === "followerCount" ? Number(event.target.value) : event.target.value })}
                      />
                    )}
                  </label>
                ))}
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-muted">Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-accent/20"
                    onChange={(event) => readAvatar(event.target.files?.[0])}
                  />
                </label>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Button onClick={saveProfile} disabled={saving} loading={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </Button>
                <button
                  className="text-sm font-semibold text-subtle transition-colors hover:text-foreground"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {posts.length ? (
            posts.map((post) => (
              <article className="border-b border-line p-5 transition-colors hover:bg-foreground/[0.025] animate-fade-in" key={post.id}>
                <div className="flex gap-3">
                  <Avatar name={character.name} src={character.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-1.5">
                      <b className="text-[15px] font-bold">{character.name}</b>
                      <span className="truncate text-[13px] text-subtle">
                        {character.handle} · turn {post.turn}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
                    <div className="mt-3 flex max-w-xs gap-5 text-sm text-subtle">
                      <span className="flex items-center gap-1.5">
                        <ReplyIcon size={14} /> {post.replyCount}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <HeartIcon size={14} /> {post.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-subtle">No posts yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}
