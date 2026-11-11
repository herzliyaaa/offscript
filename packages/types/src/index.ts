export type CharacterKind = 'player' | 'celebrity' | 'custom' | 'stan';

export type Character = {
  id: number;
  name: string;
  handle: string;
  avatarUrl: string | null;
  gender: string | null;
  kind: CharacterKind;
  role: string;
  bio: string;
  additionalDescription: string | null;
  followerCount: number;
  mood?: string;
  goals?: string[];
  memory?: CharacterMemory[];
  personality: string;
  publicPersona: string;
  voice: string;
  isPlayer: boolean;
};

export type PostKind = 'post' | 'reply' | 'quote' | 'headline' | 'dm';

export type Post = {
  id: number;
  worldId: number;
  characterId: number | null;
  parentId: number | null;
  authorName: string;
  authorHandle: string;
  authorKind: string;
  content: string;
  kind: PostKind | string;
  likes: number;
  repostCount: number;
  quoteCount: number;
  liked: boolean;
  reposted: boolean;
  replyCount: number;
  turn: number;
  createdAt: string;
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

export type EventChoice = {
  label: string;
  action: string;
};

export type EventScenario = {
  id: string;
  type: string;
  sourceName: string;
  sourceHandle: string;
  context: string;
  title: string;
  description: string;
  choices: EventChoice[];
};

export type RelationshipStatus =
  | 'neutral' | 'friendly' | 'close' | 'romantic' | 'rival' | 'enemy' | 'mentor';
export type RelationshipCategory =
  | 'friendship' | 'romance' | 'rivalry' | 'family' | 'professional' | 'neutral';

export type Relationship = {
  id: number;
  characterId: number;
  name: string;
  handle: string;
  role: string;
  level: number;
  status: string;
  category: RelationshipCategory;
  note: string;
  updatedAt: string;
};

export type RelationshipChange = {
  character: string;
  delta: number;
  status?: RelationshipStatus;
  note: string;
};

export type RelationshipMilestone = {
  id: number;
  characterId: number;
  characterName: string;
  turn: number;
  previousStatus: string;
  nextStatus: string;
  title: string;
  note: string;
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
    worldDescription?: string;
  };
  createdAt: string;
  updatedAt: string;
  player: Character | null;
  cast: Character[];
  stanAccounts: Character[];
  feed: Post[];
  events: WorldEvent[];
  relationships: Relationship[];
  relationshipMilestones: RelationshipMilestone[];
  unreadNotifications: number;
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

export type ActionOutcome = {
  world: World;
  turn: number;
  narration: string;
  posts: Post[];
  statChanges: Record<string, number>;
  relationshipChanges: RelationshipChange[];
  newGoals: string[];
  events: unknown[];
  relationships: Relationship[];
  durationMs?: number;
};

export type ApiError = {
  statusCode?: number;
  message: string | string[];
  error?: string;
  code?: string;
};

export type PaginationResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CharacterMemory = {
  text: string;
  turn: number;
  kind: 'conversation' | 'post' | 'event' | 'relationship';
};
