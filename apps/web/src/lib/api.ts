import type {
  Character,
  Conversation,
  CreateWorldInput,
  DirectMessage,
  ActionOutcome,
  CelebrityPreset,
  EventScenario,
  Post,
  Relationship,
  Scenario,
  UpdateCharacterInput,
  World,
  WorldEvent,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${API_BASE}/worlds/avatars`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Avatar upload failed: ${res.status}`);
  }
  const result = (await res.json()) as { url: string };
  return result.url;
}

export const api = {
  scenarios: () => request<Scenario[]>('/scenarios'),
  scenario: (key: string) => request<Scenario>(`/scenarios/${key}`),
  worlds: () => request<World[]>('/worlds'),
  celebrityPresets: () => request<CelebrityPreset[]>('/worlds/celebrity-presets'),
  uploadAvatar,
  world: (id: number) => request<World>(`/worlds/${id}`),
  createWorld: (input: CreateWorldInput) =>
    request<World & { durationMs?: number }>('/worlds', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateCharacter: (worldId: number, characterId: number, input: UpdateCharacterInput) =>
    request<Character>(`/worlds/${worldId}/characters/${characterId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  feed: (id: number, limit = 30) =>
    request<Post[]>(`/worlds/${id}/feed?limit=${limit}`),
  createPost: (id: number, content: string, parentId?: number) =>
    request<{ world: World; post: Post; replies: Post[]; events: unknown[]; relationships: Relationship[]; durationMs?: number }>(
      `/worlds/${id}/posts`,
      {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      },
    ),
  post: (id: number, postId: number) =>
    request<{ post: Post; replies: Post[] }>(`/worlds/${id}/posts/${postId}`),
  events: (id: number, limit = 20) =>
    request<WorldEvent[]>(`/worlds/${id}/events?limit=${limit}`),
  generateEvent: (id: number, type?: string, prompt?: string) =>
    request<{ world: World; event: WorldEvent; posts: Post[]; relationships: Relationship[]; durationMs?: number }>(
      `/worlds/${id}/events`,
      {
        method: 'POST',
        body: JSON.stringify({ type, prompt }),
      },
    ),
  eventScenarios: (id: number) =>
    request<{ scenario: EventScenario; durationMs?: number }>(
      `/worlds/${id}/event-scenarios`,
      { method: 'POST' },
    ),
  conversations: (id: number) =>
    request<Conversation[]>(`/worlds/${id}/conversations`),
  dms: (id: number, characterId: number, limit = 100) =>
    request<{ character: Character; relationship: Relationship | null; messages: DirectMessage[] }>(
      `/worlds/${id}/conversations/${characterId}?limit=${limit}`,
    ),
  sendDm: (id: number, characterId: number, content: string) =>
    request<{
      world: World;
      messages: DirectMessage[];
      character: Character;
      events: unknown[];
      relationship: Relationship | null;
      durationMs?: number;
    }>(`/worlds/${id}/conversations/${characterId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  act: (id: number, action: string) =>
    request<ActionOutcome>(`/worlds/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};
