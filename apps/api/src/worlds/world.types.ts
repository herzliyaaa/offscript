export type CharacterKind = 'player' | 'celebrity' | 'stan';

export type PostKind = 'post' | 'reply' | 'quote' | 'headline' | 'dm';

export type RelationshipStatus =
  'neutral' | 'friendly' | 'close' | 'romantic' | 'rival' | 'enemy' | 'mentor';

export type DmSender = 'player' | 'character';

export interface CharacterPersona {
  personality: string;
  publicPersona: string;
  secret: string;
  voice: string;
}

export interface WorldState {
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
  persona: CharacterPersona;
}

export interface RelationshipContext {
  character: string;
  handle: string;
  level: number;
  status: RelationshipStatus;
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
  note: string;
}

export interface GeneratedEvent {
  title: string;
  description: string;
  type: string;
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
