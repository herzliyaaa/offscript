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
  const memories = actor.memory.slice(-3).map((item) => item.text).join(' | ');
  return `- ${actor.handle} (${actor.name}, ${actor.kind}, ${actor.role}, ${actor.followerCount} followers, mood: ${actor.mood}): ${actor.persona.voice} ${actor.persona.personality}. Goals: ${actor.goals.join(', ') || 'none'}. Memory: ${memories || 'none'}`;
}

function relationshipLines(relationships: RelationshipContext[]): string {
  if (!relationships.length) {
    return 'None yet.';
  }

  return relationships
    .map(
      (relationship) =>
        `- ${relationship.character} (${relationship.handle}): ${relationship.category}, level ${relationship.level}, ${relationship.status}. ${relationship.note}`,
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
    `WORLD DESCRIPTION: ${world.state.worldDescription ?? world.state.summary}`,
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
    `- replies: exactly one casual reply from EVERY account listed above (${actors.length} replies total). Use each exact @handle once. Every reply must directly react to THE PLAYER'S POST; do not make generic replies or add accounts that are not listed.`,
    '- Write like real people online: plain words, contractions, lowercase, slang, emojis, "wait", "lol", "okay but", and "no way". Keep each reply under 180 characters. Avoid deep words, poetic monologues, dramatic narration, corporate language, and generic inspirational quotes.',
    '- Each reply has author (exact @handle), content, kind (post, reply, quote, or headline), and likes (0-1000000). Content must be the actual post text only, not a description of what the character thinks.',
    '- relationshipChanges: only for listed characters in this world. delta is -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor. note is a short reason.',
    '- events: 0-1 optional event triggered by the post. Each has title, description, type, and followerChange from -50000 to 100000 (use 0 if unchanged).',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- summary: one simple sentence under 180 characters describing what matters now.',
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
    `WORLD DESCRIPTION: ${world.state.worldDescription ?? world.state.summary}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    '',
    'CONVERSATION SO FAR:',
    transcript,
    '',
    `PLAYER'S NEW DM: ${content}`,
    '',
    'Rules:',
    "- reply: the character's casual in-character response, like a real DM. Use 1-2 short messages combined and stay under 240 characters. Do not write a speech or poetic monologue.",
    '- playerMessageRelationshipDelta: integer from -20 to 20 for the immediate effect of the player message itself. Positive means it builds trust or closeness; negative means it causes hurt, tension, or distance. Judge the exact wording, not just the topic.',
    '- relationshipDelta: integer from -20 to 20 for the character reply effect after reading the player message.',
    '- Keep each delta small for normal messages. Use values near 0 when the message is ordinary. Do not make the relationship jump unless the message or reply is clearly meaningful.',
    '- relationshipStatus: neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- note: a short updated note about the relationship.',
    '- events: 0-1 optional event triggered by this conversation. Its title is under 60 characters and its description is one short sentence under 240 characters.',
    '- summary: one simple sentence under 180 characters describing what matters now.',
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
    `WORLD DESCRIPTION: ${world.state.worldDescription ?? world.state.summary}`,
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
    '- description: 1-2 short paragraphs in second person ("You..."), under 450 characters, showing how the event hits the player. End on a decision point.',
    '- type: scandal, opportunity, rivalry, romance, career, public, or wildcard.',
    '- posts: exactly 11-14 posts. The FIRST is a lead post from one account reacting to the event. Every other post is a short reply to that lead post from a DIFFERENT account listed above, so the lead post collects at least 10 replies. Use each exact @handle at most once. Each under 180 characters with likes from 0 to 1000000.',
    '- relationshipChanges: only for listed characters in this world. delta -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- followerChange: player follower delta from -50000 to 100000 if this event changes public reach; otherwise 0.',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- summary: one simple sentence under 180 characters describing what matters now.',
    '- Events should create story momentum, not resolve everything.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');
}
