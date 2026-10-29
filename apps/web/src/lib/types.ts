export type Character = {
  id: number;
  name: string;
  handle: string;
  kind: 'player' | 'celebrity' | 'stan';
  role: string;
  bio: string;
  personality: string;
  publicPersona: string;
  voice: string;
  isPlayer: boolean;
};

export type Relationship = {
  id: number;
  characterId: number;
  name: string;
  handle: string;
  role: string;
  level: number;
  status: string;
  note: string;
  updatedAt: string;
};

export type Post = {
  id: number;
  worldId: number;
  characterId: number | null;
  parentId: number | null;
  authorName: string;
  authorHandle: string;
  authorKind: string;
  content: string;
  kind: string;
  likes: number;
  replyCount: number;
  turn: number;
  createdAt: string;
};

export type WorldEvent = {
  id: number;
  worldId: number;
  turn: number;
  type: string;
  title: string;
  content: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type World = {
  id: number;
  userId: number | null;
  name: string;
  scenarioKey: string;
  playerName: string;
  status: string;
  turn: number;
  state: {
    summary: string;
    currentScene: string;
    playerStats: Record<string, number>;
    goals: string[];
    flags: string[];
  };
  createdAt: string;
  updatedAt: string;
  player: Character | null;
  cast: Character[];
  stanAccounts: Character[];
  feed: Post[];
  events: WorldEvent[];
  relationships: Relationship[];
};

export type Scenario = {
  key: string;
  title: string;
  tagline: string;
  description: string;
  setting: string;
  playerRole: string;
  goal: string;
  tone: string;
  themes: string[];
  statLabels: string[];
};

export type DirectMessage = {
  id: number;
  worldId: number;
  characterId: number;
  sender: 'player' | 'character';
  content: string;
  turn: number;
  read: boolean;
  createdAt: string;
};

export type Conversation = {
  character: Character;
  relationship: Relationship | null;
  lastMessage: DirectMessage | null;
  unreadCount: number;
};

export type CreateWorldInput = {
  scenarioKey: string;
  playerName: string;
  playerPersona?: string;
  name?: string;
  userId?: number;
};