import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import type {
  ActorContext,
  RelationshipContext,
  WorldState,
} from './world.types.js';
import type { RecentPostContext } from './world.prompt.js';

export interface PlayerContext {
  name: string;
  handle: string;
}

export interface PostDraft {
  content: string;
  turn: number;
}

export interface ParentPostContext {
  authorHandle: string;
  content: string;
}

function actorLine(actor: ActorContext): string {
  return `- ${actor.handle} (${actor.name}, ${actor.kind}, ${actor.role}): ${actor.persona.voice} ${actor.persona.personality}`;
}

function relationshipLines(relationships: RelationshipContext[]): string {
  if (!relationships.length) {
    return 'None yet.';
  }

  return relationships
    .map(
      (relationship) =>
        `- ${relationship.character} (${relationship.handle}): level ${relationship.level}, ${relationship.status}. ${relationship.note}`,
    )
    .join('\n');
}

function feedLines(posts: RecentPostContext[]): string {
  if (!posts.length) {
    return '- The feed is quiet.';
  }

  return posts
    .map((post) => `- ${post.authorHandle} (${post.kind}): ${post.content}`)
    .join('\n');
}

export function buildPostReactionPrompt(
  template: ScenarioTemplate,
  world: {
    playerName: string;
    turn: number;
    state: WorldState;
  },
  player: PlayerContext,
  actors: ActorContext[],
  relationships: RelationshipContext[],
  recentPosts: RecentPostContext[],
  post: PostDraft,
  parent: ParentPostContext | null,
): string {
  return [
    'The player just posted on the social feed. Simulate the immediate public reaction.',
    '',
    `SCENARIO: ${template.title} — ${template.setting}`,
    `PLAYER: ${player.name} (${player.handle})`,
    `CURRENT TURN: ${world.turn}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    `PLAYER STATS: ${JSON.stringify(world.state.playerStats)}`,
    `GOALS: ${world.state.goals.join('; ') || 'None yet'}`,
    '',
    'RELATIONSHIPS:',
    relationshipLines(relationships),
    '',
    'ACCOUNTS YOU CAN USE (use their exact @handles in author):',
    actors.map(actorLine).join('\n'),
    '',
    'RECENT FEED:',
    feedLines(recentPosts),
    '',
    parent
      ? `THIS POST IS A REPLY TO: ${parent.authorHandle}: ${parent.content}`
      : 'THIS IS A NEW TOP-LEVEL POST.',
    `THE PLAYER'S POST: ${post.content}`,
    '',
    'Rules:',
    "- postLikes: integer from 0 to 1000000. Scale it to the player's Fame and Reputation.",
    '- replies: 3-6 social media reactions. At least 2 must be from the accounts above. Mix celebrity replies, stan reactions, gossip, hate, and support. Each under 280 characters.',
    '- Each reply has author (exact @handle), content, kind (post, reply, quote, or headline), and likes (0-1000000).',
    '- relationshipChanges: only for listed characters. delta is -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor. note is a short reason.',
    '- events: 0-2 optional events triggered by the post. Each has title, description, and type.',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- summary: updated 2-3 sentence running summary of the world.',
    "- Stay in each account's voice. Do not use real people.",
    '- Return ONLY JSON. No markdown, no commentary.',
  ].join('\n');
}

export function buildDmPrompt(
  template: ScenarioTemplate,
  world: {
    playerName: string;
    turn: number;
    state: WorldState;
  },
  player: PlayerContext,
  character: ActorContext,
  relationship: RelationshipContext,
  history: Array<{ sender: string; content: string }>,
  content: string,
): string {
  const transcript = history.length
    ? history
        .map(
          (message) =>
            `${message.sender === 'player' ? player.name : character.name}: ${message.content}`,
        )
        .join('\n')
    : '(No previous messages.)';

  return [
    'A private DM conversation is happening on the social app.',
    '',
    `SCENARIO: ${template.title} — ${template.setting}`,
    `PLAYER: ${player.name} (${player.handle})`,
    `CHARACTER: ${character.name} (${character.handle}), ${character.role}`,
    `CHARACTER PERSONALITY: ${character.persona.personality}`,
    `CHARACTER PUBLIC PERSONA: ${character.persona.publicPersona}`,
    `CHARACTER SECRET (never reveal directly): ${character.persona.secret}`,
    `CHARACTER VOICE: ${character.persona.voice}`,
    `RELATIONSHIP: level ${relationship.level}, ${relationship.status}. ${relationship.note}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    '',
    'CONVERSATION SO FAR:',
    transcript,
    '',
    `PLAYER'S NEW DM: ${content}`,
    '',
    'Rules:',
    "- reply: the character's response, in character, 1-3 short messages combined. Under 400 characters.",
    '- relationshipDelta: integer from -20 to 20 based on how the message lands.',
    '- relationshipStatus: neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- note: a short updated note about the relationship.',
    '- events: 0-1 optional events triggered by this conversation. Each has title, description, and type.',
    '- summary: updated 2-3 sentence running summary of the world.',
    '- The character may lie, deflect, flirt, threaten, or test the player. Secrets should only surface when earned.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ].join('\n');
}

export function buildEventPrompt(
  template: ScenarioTemplate,
  world: {
    playerName: string;
    turn: number;
    state: WorldState;
  },
  player: PlayerContext,
  actors: ActorContext[],
  relationships: RelationshipContext[],
  recentEvents: Array<{ title: string; content: string }>,
  request?: { type?: string; prompt?: string },
): string {
  const eventHistory = recentEvents.length
    ? recentEvents
        .map((event) => `- ${event.title}: ${event.content.slice(0, 200)}`)
        .join('\n')
    : '- No major events yet.';

  return [
    'Generate a new event that shakes up this Offscript world.',
    '',
    `SCENARIO: ${template.title} — ${template.setting}`,
    `PLAYER: ${player.name} (${player.handle})`,
    `CURRENT TURN: ${world.turn}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    `PLAYER STATS: ${JSON.stringify(world.state.playerStats)}`,
    `GOALS: ${world.state.goals.join('; ') || 'None yet'}`,
    '',
    'RELATIONSHIPS:',
    relationshipLines(relationships),
    '',
    'ACCOUNTS YOU CAN USE (use their exact @handles in author):',
    actors.map(actorLine).join('\n'),
    '',
    'RECENT EVENTS:',
    eventHistory,
    '',
    request?.type ? `REQUESTED EVENT TYPE: ${request.type}` : '',
    request?.prompt ? `PLAYER REQUEST: ${request.prompt}` : '',
    '',
    'Rules:',
    '- title: a short, punchy headline.',
    '- description: 2-4 paragraphs in second person ("You..."), showing how the event hits the player and the cast. End on a decision point.',
    '- type: scandal, opportunity, rivalry, romance, career, public, or wildcard.',
    '- posts: 2-5 social media reactions or headlines from the accounts above. Use exact @handles. Each under 280 characters with likes from 0 to 1000000.',
    '- relationshipChanges: only for listed characters. delta -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- summary: updated 2-3 sentence running summary of the world.',
    '- Events should create story momentum, not resolve everything.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');
}
