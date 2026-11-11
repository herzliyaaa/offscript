"use client";

import Link from "next/link";
import AvatarPicker from "@/components/AvatarPicker";
import OptionPills from "@/components/OptionPills";
import { followerOptions, genderOptions } from "@/components/characterOptions";
import Button from "@/components/ui/Button";
import type { World } from "@/lib/types";

export type CharacterDraft = {
  name: string;
  handle: string;
  bio: string;
  additionalDescription: string;
  gender: "female" | "male" | "nonbinary";
  followerCount: number;
};

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
  return (
    <div className="space-y-4">
      {world.player && <Link className="block rounded border border-[#1d9bf0]/50 bg-[#1d9bf0]/10 p-3 hover:bg-[#1d9bf0]/20" href={`/worlds/${worldId}/profile/${world.player.id}`}><div className="text-xs font-semibold uppercase tracking-wide text-[#1d9bf0]">Your profile</div><div className="mt-1 font-medium">{world.player.name}</div><div className="text-xs text-zinc-500">{world.player.handle} · View your X profile →</div></Link>}
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">People in this world</h2><Button className="rounded-full px-4 py-2" onClick={() => setAddingCharacter(!addingCharacter)}>{addingCharacter ? "Cancel" : "Add character"}</Button></div>
      {addingCharacter && <section className="rounded-2xl border border-[#38444d] bg-[#192734] p-4"><h3 className="font-bold">Create a custom character</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="sm:col-span-2"><AvatarPicker id="custom-character-avatar" preview={characterAvatarPreview} required onChange={(file, preview) => { setCharacterAvatarFile(file); setCharacterAvatarPreview(preview); }} onError={onAvatarError} /></div>{([["name", "Name", "Taylor Kim"], ["handle", "Handle", "@taylorkim"], ["bio", "Bio", "A new artist with something to prove."], ["additionalDescription", "Additional description", "Funny, ambitious, and always online."]] as const).map(([field, label, placeholder]) => <label className={field === "bio" || field === "additionalDescription" ? "space-y-1 sm:col-span-2" : "space-y-1"} key={field}><span className="text-sm text-[#71767b]">{label}{field !== "additionalDescription" && <span className="text-red-400" aria-hidden="true"> *</span>}</span>{field === "bio" || field === "additionalDescription" ? <textarea required={field !== "additionalDescription"} className="w-full rounded-xl border border-[#38444d] bg-[#101418] p-2 text-sm" placeholder={placeholder} value={characterDraft[field]} onChange={(event) => setCharacterDraft({ ...characterDraft, [field]: event.target.value })} rows={2} /> : <input required className="w-full rounded-xl border border-[#38444d] bg-[#101418] p-2 text-sm" placeholder={placeholder} value={characterDraft[field]} onChange={(event) => { const value = event.target.value; if (field === "handle") setHandleEdited(true); setCharacterDraft((current) => ({ ...current, [field]: value, ...(field === "name" && !handleEdited ? { handle: `@${value.toLowerCase().replace(/[^a-z0-9]+/g, "")}` } : {}) })); }} />}</label>)}</div><OptionPills label="Gender" value={characterDraft.gender} required options={genderOptions} onChange={(gender) => setCharacterDraft((current) => ({ ...current, gender }))} /><OptionPills label="Followers" value={characterDraft.followerCount} required options={followerOptions} onChange={(followerCount) => setCharacterDraft((current) => ({ ...current, followerCount }))} /><Button className="mt-4 rounded-full px-5 py-2" onClick={onAddCharacter} disabled={busy || !characterDraft.name.trim() || !characterDraft.handle.trim() || !characterDraft.bio.trim() || !characterAvatarFile}>Create character</Button></section>}
      <div className="grid gap-3 sm:grid-cols-2">{[...world.cast, ...world.stanAccounts].map((character) => { const relationship = world.relationships.find((item) => item.characterId === character.id); return <Link key={character.id} href={`/worlds/${worldId}/profile/${character.id}`} className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-[#38444d] dark:bg-[#192734]"><div><div className="font-medium">{character.name}</div><div className="text-xs text-zinc-500">{character.handle} · {character.kind} · {character.role}</div></div><div className="text-xs text-zinc-600 dark:text-[#e7e9ea]">{character.bio}</div>{relationship && <div className="space-y-1"><div className="flex items-center gap-2 text-xs"><span className="text-zinc-500">Relationship</span><span className="font-semibold capitalize">{relationship.status}</span><span className="text-zinc-500">{relationship.level}/100</span></div><div className="h-1.5 w-full rounded bg-zinc-800"><div className={`h-1.5 rounded ${relationship.level < 0 ? "bg-[#f91880]" : relationship.level >= 60 ? "bg-[#00ba7c]" : "bg-[#1d9bf0]"}`} style={{ width: `${Math.max(0, (relationship.level + 100) / 2)}%` }} /></div>{relationship.note && <div className="text-xs italic text-zinc-500">{relationship.note}</div>}</div>}</Link>; })}</div>
    </div>
  );
}
