import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import type {
  ActorContext,
  RelationshipContext,
  WorldState,
} from './world.types.js';

export interface WorldGenerationInput {
  playerName: string;
  playerPersona?: string;
  playerAdditionalDescription?: string;
  worldName?: string;
}

export interface RecentPostContext {
  authorName: string;
  authorHandle: string;
  content: string;
  kind: string;
}

export interface ActiveEventContext {
  title?: string;
  description?: string;
  sourceName?: string;
  sourceHandle?: string;
}

export const WORLD_SYSTEM_PROMPT = [
  'You are the simulation engine for "Offscript", a single-player social-media life sim.',
  'You write vivid, grounded celebrity drama with sharp dialogue and consequences.',
  'Keep social posts, replies, DMs, and captions casual and natural, like real people texting or posting online.',
  'Prefer short sentences, contractions, slang, playful reactions, and specific everyday wording over poetic, formal, or philosophical language.',
  'Use simple casual words that are easy to understand. Avoid deep, poetic, academic, or overly dramatic language.',
  'Do not make every character sound profound. Social posts should feel spontaneous, messy, funny, blunt, or awkward when appropriate.',
  'You always stay in character and never mention that you are an AI.',
  'You output only valid JSON that matches the requested schema.',
].join(' ');

export function buildWorldGenerationPrompt(
  template: ScenarioTemplate,
  input: WorldGenerationInput,
): string {
  return [
    'Create the opening state of a new Offscript world.',
    '',
    `SCENARIO: ${template.title}`,
    `SETTING: ${template.setting}`,
    `PLAYER ROLE: ${template.playerRole}`,
    `PLAYER NAME: ${input.playerName}`,
    `PLAYER PERSONA: ${input.playerPersona ?? 'Invent an interesting public persona.'}`,
    `PLAYER DETAILS: ${input.playerAdditionalDescription ?? 'No extra details.'}`,
    input.worldName ? `WORLD NAME: ${input.worldName}` : '',
    `CORE GOAL: ${template.goal}`,
    `TONE: ${template.tone}`,
    `THEMES: ${template.themes.join(', ')}`,
    `STATS: ${template.statLabels.join(', ')} (each 0-100)`,
    `CAST GUIDANCE: ${template.castGuidance}`,
    `OPENING HOOK: ${template.openingHook}`,
    '',
    'Rules:',
    '- Invent original fictional celebrities. Never use real people.',
    '- Give every cast member a unique Twitter-style handle starting with @.',
    '- Give every cast member a distinct voice, a conflicting goal, and a secret that can surface later.',
    '- You MUST create at least 4 and at most 5 cast members.',
    '- worldName: a short, evocative name for this world.',
    '- summary: one simple sentence under 180 characters describing the current state.',
    '- openingScene: 2-4 paragraphs in second person ("You..."), ending on a decision point.',
    '- playerStats: one integer from 0 to 100 for every listed stat.',
    '- goals: 2-3 concrete short-term goals.',
    '- openingPosts: 6-12 casual in-world social posts that feel like a busy feed. The FIRST post is a lead post that starts some drama; every other post is a short reply to that lead post from a different invented account (fans, gossip pages, haters, memes). Each under 280 characters with likes from 0 to 1000000. Use natural social-media wording, not polished essays.',
    '- kind must be one of: post, reply, quote, headline.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');
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

export function buildTurnPrompt(
  template: ScenarioTemplate,
  world: {
    playerName: string;
    turn: number;
    state: WorldState;
  },
  actors: ActorContext[],
  relationships: RelationshipContext[],
  recentPosts: RecentPostContext[],
  action: string,
  activeEvent?: ActiveEventContext,
): string {
  const feed = recentPosts.length
    ? recentPosts
        .map((post) => `- ${post.authorHandle} (${post.kind}): ${post.content}`)
        .join('\n')
    : '- The feed is quiet.';

  return [
    'Continue the Offscript simulation.',
    '',
    `SCENARIO: ${template.title} — ${template.setting}`,
    `PLAYER: ${world.playerName} (${template.playerRole})`,
    `CURRENT TURN: ${world.turn}`,
    `WORLD DESCRIPTION: ${world.state.worldDescription ?? world.state.summary}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    `CURRENT SCENE: ${world.state.currentScene}`,
    `PLAYER STATS: ${JSON.stringify(world.state.playerStats)}`,
    `GOALS: ${world.state.goals.join('; ') || 'None yet'}`,
    '',
    'RELATIONSHIPS:',
    relationshipLines(relationships),
    '',
    'SOCIAL ACCOUNTS:',
    actors.map(actorLine).join('\n'),
    '',
    'RECENT SOCIAL FEED:',
    feed,
    '',
    `PLAYER ACTION: ${action}`,
    activeEvent
      ? `ACTIVE EVENT: ${activeEvent.title} — ${activeEvent.description} (involving ${activeEvent.sourceName} ${activeEvent.sourceHandle})`
      : '',
    '',
    'Rules:',
    activeEvent
      ? '- Resolve the ACTIVE EVENT exactly. Keep the same people, names, handles, and situation. Do not replace the source character with another character.'
      : '',
    '- narration: 2 short paragraphs maximum, in second person ("You..."), showing the consequence and one complication. Keep it under 500 characters and end on a decision point.',
    '- posts: exactly 11-14 posts. The FIRST is a lead post from one account reacting to the action. Every other post is a short reply to that lead post from a DIFFERENT account listed above, so the lead post collects at least 10 replies. Use each exact @handle at most once. Each under 180 characters with likes from 0 to 1000000.',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- relationshipChanges: only for listed characters in this world. delta is -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- events: 0-1 optional world event triggered by the action. Its title is under 60 characters and its description is 1-2 short sentences under 240 characters. followerChange is the player audience delta from -50000 to 100000; use 0 if unchanged.',
    '- summary: one simple sentence under 180 characters describing what matters now.',
    '- newGoals: 0-2 new goals, only when the story earns them.',
    '- Do not resolve the core goal too quickly. Leave room for the next turn.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ].join('\n');
}

export function buildEventScenariosPrompt(
  template: ScenarioTemplate,
  world: {
    playerName: string;
    turn: number;
    state: WorldState;
  },
  player: { name: string; handle: string },
  actors: ActorContext[],
  relationships: RelationshipContext[],
): string {
  return [
    'Create one playable event scenario for the next turn of Offscript.',
    '',
    `SCENARIO: ${template.title} — ${template.setting}`,
    `PLAYER: ${world.playerName} (${player.handle}, ${template.playerRole})`,
    `CURRENT TURN: ${world.turn}`,
    `WORLD DESCRIPTION: ${world.state.worldDescription ?? world.state.summary}`,
    `WORLD SUMMARY: ${world.state.summary}`,
    `CURRENT SCENE: ${world.state.currentScene}`,
    `PLAYER STATS: ${JSON.stringify(world.state.playerStats)}`,
    '',
    'RELATIONSHIPS:',
    relationshipLines(relationships),
    '',
    'SOCIAL ACCOUNTS:',
    actors.map(actorLine).join('\n'),
    '',
    'Rules:',
    '- Create one simple, relatable scenario tied to the WORLD DESCRIPTION. It can be about a friend feeling ignored, a partner asking for honesty, family pressure, a missed plan, jealousy, an apology, a boundary, money, work, reputation, or a career chance. Do not make every event about idols, labels, music, or the entertainment industry.',
    '- sourceName and sourceHandle must identify the account most directly involved, using an exact name and @handle from the social accounts above.',
    '- context should be a short social-media-style line such as "sent you a private invitation", "mentioned you in a post", or "called with unexpected news". Do not use category names.',
    '- Use the exact @handles above in the descriptions. Write directly to the player using "you".',
    '- Use plain, casual words. Do not use deep, poetic, formal, or complicated language.',
    '- The description should be 2 short paragraphs, under 450 characters, with everyday details and a clear decision point.',
    '- Include exactly 3 simple choices. Each action is one short first-person response the player can send.',
    '- label is 2-4 words. action is under 120 characters.',
    '- followerChange is the player follower delta from -50000 to 100000 based on this event. Use 0 if unchanged.',
    '- Do not resolve the scenario in the description. Never use real celebrities.',
    '- Return ONLY JSON matching the requested schema.',
  ].join('\n');
}
