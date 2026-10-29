import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import type {
  ActorContext,
  RelationshipContext,
  WorldState,
} from './world.types.js';

export interface WorldGenerationInput {
  playerName: string;
  playerPersona?: string;
  worldName?: string;
}

export interface RecentPostContext {
  authorName: string;
  authorHandle: string;
  content: string;
  kind: string;
}

export const WORLD_SYSTEM_PROMPT = [
  'You are the simulation engine for "Offscript", a single-player social-media life sim.',
  'You write vivid, grounded celebrity drama with sharp dialogue and consequences.',
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
    '- summary: 2-3 sentences describing the current state of the world.',
    '- openingScene: 2-4 paragraphs in second person ("You..."), ending on a decision point.',
    '- playerStats: one integer from 0 to 100 for every listed stat.',
    '- goals: 2-3 concrete short-term goals.',
    '- openingPosts: 3-5 in-world social posts or headlines, each under 280 characters and with likes from 0 to 1000000.',
    '- kind must be one of: post, reply, quote, headline.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');
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
    '',
    'Rules:',
    '- narration: 2-4 paragraphs in second person ("You..."), showing consequences and new complications, ending on a decision point.',
    '- posts: 2-5 in-world reactions from the accounts above, each under 280 characters with likes from 0 to 1000000. Use their exact @handles in author.',
    '- statChanges: integer deltas from -20 to 20 for every stat. Use 0 when unchanged.',
    '- relationshipChanges: only for listed characters. delta is -20 to 20. status is neutral, friendly, close, romantic, rival, enemy, or mentor.',
    '- events: 0-2 optional world events triggered by the action. Each has title, description, and type.',
    '- summary: updated 2-3 sentence running summary of the world.',
    '- newGoals: 0-2 new goals, only when the story earns them.',
    '- Do not resolve the core goal too quickly. Leave room for the next turn.',
    '- Return ONLY JSON. No markdown, no commentary.',
  ].join('\n');
}
