import type {
  CharacterKind,
  CharacterMemory,
  RelationshipCategory,
  RelationshipStatus,
} from '@offscript/types';

export type {
  CharacterKind,
  CharacterMemory,
  RelationshipCategory,
  RelationshipStatus,
} from '@offscript/types';

export type PostKind = 'post' | 'reply' | 'quote' | 'headline' | 'dm';

export type DmSender = 'player' | 'character';

export interface AvatarUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface CharacterPersona {
  personality: string;
  publicPersona: string;
  secret: string;
  voice: string;
}

export interface WorldState {
  worldDescription?: string;
  summary: string;
  currentScene: string;
  playerStats: Record<string, number>;
  goals: string[];
  flags: string[];
}

export interface ActorContext {
  id: number;
  name: string;
  handle: string;
  kind: CharacterKind;
  role: string;
  followerCount: number;
  memory: CharacterMemory[];
  goals: string[];
  mood: string;
  persona: CharacterPersona;
}

export interface RelationshipContext {
  character: string;
  handle: string;
  level: number;
  status: RelationshipStatus;
  category: RelationshipCategory;
  note: string;
}

export interface GeneratedCastMember {
  name: string;
  handle: string;
  role: string;
  bio: string;
  personality: string;
  publicPersona: string;
  secret: string;
  voice: string;
}

export interface GeneratedPost {
  author: string;
  content: string;
  kind: PostKind;
  likes?: number;
}

export interface GeneratedWorld {
  worldName: string;
  summary: string;
  openingScene: string;
  playerStats: Record<string, number>;
  goals: string[];
  cast: GeneratedCastMember[];
  openingPosts: GeneratedPost[];
}

export interface RelationshipChange {
  character: string;
  delta: number;
  status?: RelationshipStatus;
  category?: RelationshipCategory;
  note: string;
}

export interface GeneratedEvent {
  title: string;
  description: string;
  type: string;
  followerChange?: number;
  choices?: GeneratedEventChoice[];
}

export interface GeneratedEventChoice {
  label: string;
  action: string;
}

export interface GeneratedEventScenario extends GeneratedEvent {
  sourceName: string;
  sourceHandle: string;
  context: string;
  choices: GeneratedEventChoice[];
}

export interface GeneratedReaction {
  postLikes: number;
  replies: GeneratedPost[];
  relationshipChanges: RelationshipChange[];
  events: GeneratedEvent[];
  statChanges: Record<string, number>;
  summary: string;
}

export interface GeneratedTurn {
  narration: string;
  summary: string;
  statChanges: Record<string, number>;
  relationshipChanges: RelationshipChange[];
  posts: GeneratedPost[];
  newGoals: string[];
  events: GeneratedEvent[];
}

export interface GeneratedDmReply {
  reply: string;
  playerMessageRelationshipDelta: number;
  relationshipDelta: number;
  relationshipStatus: RelationshipStatus;
  note: string;
  events: GeneratedEvent[];
  summary: string;
}

export interface GeneratedWorldEvent extends GeneratedEvent {
  posts: GeneratedPost[];
  relationshipChanges: RelationshipChange[];
  statChanges: Record<string, number>;
  summary: string;
}
