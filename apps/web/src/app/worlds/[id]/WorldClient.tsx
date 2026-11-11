"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LoadingState from "@/components/LoadingState";
import { api } from "@/lib/api";
import type { ActionOutcome, EventScenario, World } from "@/lib/types";
import CastTab, { type CharacterDraft } from "./CastTab";
import EventsTab from "./EventsTab";
import FeedTab from "./FeedTab";
import WorldShell, { type Tab } from "./WorldShell";

const emptyCharacterDraft: CharacterDraft = {
  name: "",
  handle: "",
  bio: "",
  additionalDescription: "",
  gender: "female",
  followerCount: 1000,
};

export default function WorldPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [postContent, setPostContent] = useState("");
  const [actionText, setActionText] = useState("");
  const [eventScenario, setEventScenario] = useState<EventScenario | null>(null);
  const [customResponse, setCustomResponse] = useState("");
  const [eventOutcome, setEventOutcome] = useState<ActionOutcome | null>(null);
  const [editingScenario, setEditingScenario] = useState(false);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [characterDraft, setCharacterDraft] = useState<CharacterDraft>(emptyCharacterDraft);
  const [characterAvatarFile, setCharacterAvatarFile] = useState<File | null>(null);
  const [characterAvatarPreview, setCharacterAvatarPreview] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = tabParam === "events" || tabParam === "cast" ? tabParam : "feed";

  const loadWorld = useCallback(async () => {
    try {
      setWorld(await api.world(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load world");
    }
  }, [id]);

  useEffect(() => {
    (async () => { setLoading(true); await loadWorld(); setLoading(false); })();
  }, [loadWorld]);

  useEffect(() => {
    if (!busy) return;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab !== "events" || eventScenario || eventOutcome) return;
    let cancelled = false;
    api.eventScenarios(id)
      .then((result) => {
        if (cancelled) return;
        setEventScenario(result.scenario);
        setLastDuration(result.durationMs ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load events");
      });
    return () => {
      cancelled = true;
    };
  }, [eventOutcome, eventScenario, id, tab]);

  async function submitPost() {
    if (!postContent.trim()) return;
    setElapsed(0);
    await run(async () => { const result = await api.createPost(id, postContent); setLastDuration(result.durationMs ?? null); setPostContent(""); await loadWorld(); });
  }

  async function submitAction() {
    if (!actionText.trim()) return;
    setElapsed(0);
    await run(async () => { const result = await api.act(id, actionText); setLastDuration(result.durationMs ?? null); setActionText(""); await loadWorld(); });
  }

  async function chooseEvent(action: string) {
    setElapsed(0);
    await run(async () => {
      const result = await api.act(id, action, eventScenario ?? undefined);
      setLastDuration(result.durationMs ?? null);
      await loadWorld();
      setEventScenario(null);
      setCustomResponse("");
      setEditingScenario(false);
      setEventOutcome(result);
    });
  }

  function updateScenario(update: Partial<EventScenario>) {
    setEventScenario((current) => current ? { ...current, ...update } : current);
  }

  function updateChoice(index: number, update: Partial<EventScenario["choices"][number]>) {
    setEventScenario((current) => current ? { ...current, choices: current.choices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, ...update } : choice) } : current);
  }

  async function rerollScenario() {
    setElapsed(0);
    await run(async () => {
      const result = await api.eventScenarios(id);
      setEventScenario(result.scenario);
      setEventOutcome(null);
      setCustomResponse("");
      setEditingScenario(false);
      setLastDuration(result.durationMs ?? null);
      await loadWorld();
    });
  }

  async function addCharacter() {
    if (!characterDraft.name.trim() || !characterDraft.handle.trim() || !characterDraft.bio.trim() || !characterAvatarFile) return;
    await run(async () => {
      const avatarUrl = await api.uploadAvatar(characterAvatarFile);
      await api.createCharacter(id, { ...characterDraft, avatarUrl });
      setCharacterDraft(emptyCharacterDraft);
      setCharacterAvatarFile(null);
      setCharacterAvatarPreview("");
      setHandleEdited(false);
      setAddingCharacter(false);
      await loadWorld();
    });
  }

  if (loading || !world) return <LoadingState label="Loading world…" />;

  return (
    <WorldShell id={id} world={world} tab={tab} lastDuration={lastDuration} error={error} busy={busy} elapsed={elapsed}>
      {tab === "feed" && <FeedTab world={world} worldId={id} postContent={postContent} setPostContent={setPostContent} actionText={actionText} setActionText={setActionText} onSubmitPost={() => void submitPost()} onSubmitAction={() => void submitAction()} onChanged={loadWorld} busy={busy} />}
      {tab === "events" && <EventsTab world={world} worldId={id} busy={busy} eventScenario={eventScenario} eventOutcome={eventOutcome} customResponse={customResponse} editingScenario={editingScenario} setCustomResponse={setCustomResponse} setEditingScenario={setEditingScenario} chooseEvent={(action) => void chooseEvent(action)} rerollScenario={rerollScenario} updateScenario={updateScenario} updateChoice={updateChoice} onContinue={() => setEventOutcome(null)} />}
      {tab === "cast" && <CastTab world={world} worldId={id} addingCharacter={addingCharacter} setAddingCharacter={setAddingCharacter} characterDraft={characterDraft} setCharacterDraft={setCharacterDraft} characterAvatarPreview={characterAvatarPreview} characterAvatarFile={characterAvatarFile} setCharacterAvatarFile={setCharacterAvatarFile} setCharacterAvatarPreview={setCharacterAvatarPreview} setHandleEdited={setHandleEdited} handleEdited={handleEdited} onAvatarError={setError} onAddCharacter={() => void addCharacter()} busy={busy} />}
    </WorldShell>
  );
}
