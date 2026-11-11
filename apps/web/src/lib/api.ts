import type {
  Character,
  CreateCharacterInput,
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
  WorldEnergy,
  WorldEvent,
} from './types';
import type { ApiError } from '@offscript/types';

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
    let message = text || `Request failed: ${res.status}`;
    try {
      const error = JSON.parse(text) as ApiError & { message?: unknown };
      const raw = error.message;
      if (Array.isArray(raw)) {
        message = raw.join(', ');
      } else if (typeof raw === 'string') {
        message = raw;
      } else if (raw && typeof raw === 'object') {
        // Custom exceptions (e.g. INSUFFICIENT_ENERGY) nest their payload
        // under `message`; surface the human-readable string inside it.
        const nested = (raw as { message?: unknown }).message;
        if (typeof nested === 'string') message = nested;
      }
    } catch {
      // Preserve the server's plain-text error response.
    }
    throw new Error(message);
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
  createCharacter: (worldId: number, input: CreateCharacterInput) =>
    request<Character>(`/worlds/${worldId}/characters`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  feed: (id: number, limit = 30) =>
    request<Post[]>(`/worlds/${id}/feed?limit=${limit}`),
  createPost: (id: number, content: string, parentId?: number, quotePostId?: number) =>
    request<{ world: World; energy?: WorldEnergy; post: Post; replies: Post[]; events: unknown[]; relationships: Relationship[]; durationMs?: number }>(
      `/worlds/${id}/posts`,
      {
        method: 'POST',
        body: JSON.stringify({ content, parentId, quotePostId }),
      },
    ),
  post: (id: number, postId: number) =>
    request<{ post: Post; replies: Post[] }>(`/worlds/${id}/posts/${postId}`),
  interactWithPost: (id: number, postId: number, type: 'like' | 'repost') =>
    request<{ active: boolean; type: string; repostCount: number; likeCount: number }>(
      `/worlds/${id}/posts/${postId}/interactions`,
      { method: 'POST', body: JSON.stringify({ type }) },
    ),
  reportPost: (id: number, postId: number, reason: string, details?: string) =>
    request(`/worlds/${id}/posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),
  reportCharacter: (id: number, characterId: number, reason: string, details?: string) =>
    request(`/worlds/${id}/characters/${characterId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),
  blockCharacter: (id: number, characterId: number, kind: 'block' | 'mute') =>
    request<{ active: boolean; kind: string }>(`/worlds/${id}/characters/${characterId}/block`, {
      method: 'POST',
      body: JSON.stringify({ kind }),
    }),
  notifications: (id: number) =>
    request<{ notifications: import('./types').Notification[]; unreadCount: number }>(
      `/worlds/${id}/notifications`,
    ),
  markNotificationsRead: (id: number) =>
    request<{ updated: number }>(`/worlds/${id}/notifications/read`, { method: 'PATCH' }),
  events: (id: number, limit = 20) =>
    request<WorldEvent[]>(`/worlds/${id}/events?limit=${limit}`),
  generateEvent: (id: number, type?: string, prompt?: string) =>
    request<{ world: World; energy?: WorldEnergy; event: WorldEvent; posts: Post[]; relationships: Relationship[]; durationMs?: number }>(
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
  addEnergyBonus: (id: number, amount = 10, key?: string) =>
    request<WorldEnergy>(`/worlds/${id}/energy/bonus`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
      ...(key ? { headers: { 'x-energy-admin-key': key } } : {}),
    }),
  conversations: (id: number) =>
    request<Conversation[]>(`/worlds/${id}/conversations`),
  dms: (id: number, characterId: number, limit = 100) =>
    request<{ character: Character; relationship: Relationship | null; messages: DirectMessage[] }>(
      `/worlds/${id}/conversations/${characterId}?limit=${limit}`,
    ),
  sendDm: (id: number, characterId: number, content: string) =>
    request<{
      world: World;
      energy?: WorldEnergy;
      messages: DirectMessage[];
      character: Character;
      events: unknown[];
      relationship: Relationship | null;
      relationshipDelta: number;
      durationMs?: number;
    }>(`/worlds/${id}/conversations/${characterId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  act: (id: number, action: string, event?: Partial<EventScenario>) =>
    request<ActionOutcome>(`/worlds/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        eventTitle: event?.title,
        eventDescription: event?.description,
        eventSourceName: event?.sourceName,
        eventSourceHandle: event?.sourceHandle,
      }),
    }),
};
