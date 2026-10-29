import type {
  Character,
  Conversation,
  CreateWorldInput,
  DirectMessage,
  Post,
  Relationship,
  Scenario,
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

export const api = {
  scenarios: () => request<Scenario[]>('/scenarios'),
  scenario: (key: string) => request<Scenario>(`/scenarios/${key}`),
  worlds: () => request<World[]>('/worlds'),
  world: (id: number) => request<World>(`/worlds/${id}`),
  createWorld: (input: CreateWorldInput) =>
    request<World>('/worlds', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  feed: (id: number, limit = 30) =>
    request<Post[]>(`/worlds/${id}/feed?limit=${limit}`),
  createPost: (id: number, content: string, parentId?: number) =>
    request<{ world: World; post: Post; replies: Post[]; events: unknown[]; relationships: Relationship[] }>(
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
    request<{ world: World; event: WorldEvent; posts: Post[]; relationships: Relationship[] }>(
      `/worlds/${id}/events`,
      {
        method: 'POST',
        body: JSON.stringify({ type, prompt }),
      },
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
    }>(`/worlds/${id}/conversations/${characterId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  act: (id: number, action: string) =>
    request<{
      world: World;
      turn: number;
      narration: string;
      posts: Post[];
      statChanges: Record<string, number>;
      relationshipChanges: unknown[];
      newGoals: string[];
      events: unknown[];
      relationships: Relationship[];
    }>(`/worlds/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};
