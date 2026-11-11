import type {
  ActionOutcome as SharedActionOutcome,
  Character as SharedCharacter,
  DirectMessage as SharedDirectMessage,
  EventScenario as SharedEventScenario,
  Post as SharedPost,
  World as SharedWorld,
} from "@offscript/types";

export type Character = SharedCharacter;

export type UpdateCharacterInput = {
  name?: string;
  handle?: string;
  avatarUrl?: string;
  gender?: string;
  bio?: string;
  additionalDescription?: string;
  followerCount?: number;
};

export type CreateCharacterInput = {
  name: string;
  handle: string;
  bio: string;
  additionalDescription?: string;
  gender: 'female' | 'male' | 'nonbinary';
  followerCount: number;
  avatarUrl: string;
};

export type Relationship = {
  id: number;
  characterId: number;
  name: string;
  handle: string;
  role: string;
  level: number;
  status: string;
  category: 'friendship' | 'romance' | 'rivalry' | 'family' | 'professional' | 'neutral';
  note: string;
  updatedAt: string;
};

export type Post = SharedPost;

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

export type EventChoice = {
  label: string;
  action: string;
};

export type EventScenario = SharedEventScenario;

export type ActionOutcome = SharedActionOutcome;

export type World = SharedWorld;

export type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
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

export type DirectMessage = SharedDirectMessage;

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
  associatedCelebrityKeys?: string[];
  playerHandle?: string;
  playerGender?: string;
  playerAdditionalDescription?: string;
  playerFollowerCount?: number;
  playerAvatarUrl?: string;
  name?: string;
  userId?: number;
};

export type CelebrityPreset = {
  key: string;
  name: string;
  handle: string;
  gender: string;
  role: string;
  bio: string;
  additionalDescription: string;
  followerCount: number;
};