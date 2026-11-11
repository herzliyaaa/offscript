"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import AvatarPicker from "@/components/AvatarPicker";
import OptionPills from "@/components/OptionPills";
import { followerOptions, genderOptions } from "@/components/characterOptions";
import Button from "@/components/ui/Button";
import { AtIcon, ChevronRightIcon, MapPinIcon, PlusIcon, UserIcon } from "@/components/ui/Icons";
import type { World } from "@/lib/types";

export type CharacterDraft = {
  name: string;
  handle: string;
  bio: string;
  additionalDescription: string;
  gender: "female" | "male" | "nonbinary";
  followerCount: number;
};

const draftFields = [
  ["name", "Name", "Taylor Kim"],
  ["handle", "Handle", "@taylorkim"],
  ["bio", "Bio", "A new artist with something to prove."],
  ["additionalDescription", "Additional description", "Funny, ambitious, and always online."],
] as const;

function relationshipTone(level: number) {
  if (level < 0) return { bar: "from-rose-500 to-red-400", text: "text-danger" };
  if (level >= 60) return { bar: "from-emerald-400 to-teal-400", text: "text-success" };
  return { bar: "from-indigo-400 to-violet-400", text: "text-accent" };
}

export default function CastTab({
  world,
  worldId,
  addingCharacter,
  setAddingCharacter,
  characterDraft,
  setCharacterDraft,
  characterAvatarPreview,
  characterAvatarFile,
  setCharacterAvatarFile,
  setCharacterAvatarPreview,
  setHandleEdited,
  handleEdited,
  onAvatarError,
  onAddCharacter,
  busy,
}: {
  world: World;
  worldId: number;
  addingCharacter: boolean;
  setAddingCharacter: (value: boolean) => void;
  characterDraft: CharacterDraft;
  setCharacterDraft: React.Dispatch<React.SetStateAction<CharacterDraft>>;
  characterAvatarPreview: string;
  characterAvatarFile: File | null;
  setCharacterAvatarFile: (file: File | null) => void;
  setCharacterAvatarPreview: (value: string) => void;
  setHandleEdited: (value: boolean) => void;
  handleEdited: boolean;
  onAvatarError: (message: string) => void;
  onAddCharacter: () => void;
  busy: boolean;
}) {
  const people = [...world.cast, ...world.stanAccounts];

  return (
    <div className="space-y-5">
      {world.player && (
        <Link
          className="glass-card card-hover focus-ring flex items-center gap-4 p-4"
          href={`/worlds/${worldId}/profile/${world.player.id}`}
        >
          <Avatar name={world.player.name} src={world.player.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="chip !py-0.5 !text-[10px] uppercase tracking-widest !text-accent !border-accent/30 !bg-accent/10">
                <UserIcon size={11} /> You
              </span>
            </div>
            <div className="mt-1.5 font-bold">{world.player.name}</div>
            <div className="text-[13px] text-subtle">{world.player.handle} · view your profile</div>
          </div>
          <ChevronRightIcon size={18} className="shrink-0 text-subtle" />
        </Link>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">People in this world</h2>
        <Button
          variant={addingCharacter ? "secondary" : "primary"}
          size="sm"
          icon={addingCharacter ? undefined : <PlusIcon size={14} />}
          onClick={() => setAddingCharacter(!addingCharacter)}
        >
          {addingCharacter ? "Cancel" : "Add character"}
        </Button>
      </div>

      {addingCharacter && (
        <section className="glass-card p-5 animate-scale-in sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <PlusIcon size={16} className="text-accent" /> Create a custom character
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <AvatarPicker
                id="custom-character-avatar"
                preview={characterAvatarPreview}
                required
                onChange={(file, preview) => {
                  setCharacterAvatarFile(file);
                  setCharacterAvatarPreview(preview);
                }}
                onError={onAvatarError}
              />
            </div>
            {draftFields.map(([field, label, placeholder]) => {
              const wide = field === "bio" || field === "additionalDescription";
              return (
                <label className={wide ? "block space-y-1.5 sm:col-span-2" : "block space-y-1.5"} key={field}>
                  <span className="text-sm font-medium text-muted">
                    {label}
                    {field !== "additionalDescription" && <span className="text-danger" aria-hidden="true"> *</span>}
                  </span>
                  {wide ? (
                    <textarea
                      required={field !== "additionalDescription"}
                      className="field"
                      placeholder={placeholder}
                      value={characterDraft[field]}
                      onChange={(event) => setCharacterDraft({ ...characterDraft, [field]: event.target.value })}
                      rows={2}
                    />
                  ) : (
                    <div className="relative">
                      {field === "handle" && (
                        <AtIcon size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                      )}
                      <input
                        required
                        className={`field ${field === "handle" ? "!pl-9" : ""}`}
                        placeholder={placeholder}
                        value={characterDraft[field]}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (field === "handle") setHandleEdited(true);
                          setCharacterDraft((current) => ({
                            ...current,
                            [field]: value,
                            ...(field === "name" && !handleEdited
                              ? { handle: `@${value.toLowerCase().replace(/[^a-z0-9]+/g, "")}` }
                              : {}),
                          }));
                        }}
                      />
                    </div>
                  )}
                </label>
              );
            })}
          </div>
          <div className="mt-5 space-y-4">
            <OptionPills
              label="Gender"
              value={characterDraft.gender}
              required
              options={genderOptions}
              onChange={(gender) => setCharacterDraft((current) => ({ ...current, gender }))}
            />
            <OptionPills
              label="Followers"
              value={characterDraft.followerCount}
              required
              options={followerOptions}
              onChange={(followerCount) => setCharacterDraft((current) => ({ ...current, followerCount }))}
            />
          </div>
          <Button
            className="mt-6"
            size="lg"
            onClick={onAddCharacter}
            disabled={busy || !characterDraft.name.trim() || !characterDraft.handle.trim() || !characterDraft.bio.trim() || !characterAvatarFile}
          >
            Create character
          </Button>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {people.map((character) => {
          const relationship = world.relationships.find((item) => item.characterId === character.id);
          const tone = relationship ? relationshipTone(relationship.level) : null;
          return (
            <Link
              key={character.id}
              href={`/worlds/${worldId}/profile/${character.id}`}
              className="glass-card card-hover focus-ring group space-y-3 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar name={character.name} src={character.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold group-hover:text-accent transition-colors">{character.name}</div>
                  <div className="truncate text-xs text-subtle">
                    {character.handle} · {character.kind} · {character.role}
                  </div>
                </div>
              </div>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{character.bio}</p>
              {relationship && tone && (
                <div className="space-y-1.5 border-t border-line pt-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1 text-subtle">
                      <MapPinIcon size={11} />
                      <span className="font-semibold capitalize">{relationship.status}</span>
                    </span>
                    <span className={`font-bold tabular-nums ${tone.text}`}>{relationship.level}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-[width] duration-500`}
                      style={{ width: `${Math.max(0, (relationship.level + 100) / 2)}%` }}
                    />
                  </div>
                  {relationship.note && <p className="text-xs italic leading-relaxed text-subtle">{relationship.note}</p>}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {people.length === 0 && (
        <div className="glass-card p-10 text-center">
          <p className="font-semibold">No one else here yet</p>
          <p className="mt-1 text-sm text-muted">Add a character to start a new storyline.</p>
        </div>
      )}
    </div>
  );
}
