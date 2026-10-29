import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import { RELATIONSHIP_STATUSES } from './world.utils.js';

export function statProperties(
  labels: string[],
  delta: boolean,
): Record<string, object> {
  return Object.fromEntries(
    labels.map((label) => [
      label,
      delta
        ? { type: 'integer', minimum: -20, maximum: 20 }
        : { type: 'integer', minimum: 0, maximum: 100 },
    ]),
  );
}

const postSchema = {
  type: 'object',
  properties: {
    author: { type: 'string' },
    content: { type: 'string' },
    kind: { type: 'string', enum: ['post', 'reply', 'headline', 'dm'] },
    likes: { type: 'integer', minimum: 0, maximum: 1000000 },
  },
  required: ['author', 'content', 'kind', 'likes'],
  additionalProperties: false,
};

export function buildWorldSchema(template: ScenarioTemplate) {
  return {
    type: 'object',
    properties: {
      worldName: { type: 'string' },
      summary: { type: 'string' },
      openingScene: { type: 'string' },
      playerStats: {
        type: 'object',
        properties: statProperties(template.statLabels, false),
        required: template.statLabels,
        additionalProperties: false,
      },
      goals: { type: 'array', items: { type: 'string' } },
      cast: {
        type: 'array',
        minItems: 4,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            handle: { type: 'string' },
            role: { type: 'string' },
            bio: { type: 'string' },
            personality: { type: 'string' },
            publicPersona: { type: 'string' },
            secret: { type: 'string' },
            voice: { type: 'string' },
          },
          required: [
            'name',
            'handle',
            'role',
            'bio',
            'personality',
            'publicPersona',
            'secret',
            'voice',
          ],
          additionalProperties: false,
        },
      },
      openingPosts: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: postSchema,
      },
    },
    required: [
      'worldName',
      'summary',
      'openingScene',
      'playerStats',
      'goals',
      'cast',
      'openingPosts',
    ],
    additionalProperties: false,
  };
}

export function buildTurnSchema(template: ScenarioTemplate) {
  return {
    type: 'object',
    properties: {
      narration: { type: 'string' },
      summary: { type: 'string' },
      statChanges: {
        type: 'object',
        properties: statProperties(template.statLabels, true),
        required: template.statLabels,
        additionalProperties: false,
      },
      relationshipChanges: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            character: { type: 'string' },
            delta: { type: 'integer', minimum: -20, maximum: 20 },
            status: { type: 'string', enum: RELATIONSHIP_STATUSES },
            note: { type: 'string' },
          },
          required: ['character', 'delta', 'status', 'note'],
          additionalProperties: false,
        },
      },
      posts: { type: 'array', items: postSchema },
      newGoals: { type: 'array', items: { type: 'string' } },
      events: {
        type: 'array',
        maxItems: 2,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['title', 'description', 'type'],
          additionalProperties: false,
        },
      },
    },
    required: [
      'narration',
      'summary',
      'statChanges',
      'relationshipChanges',
      'posts',
      'newGoals',
      'events',
    ],
    additionalProperties: false,
  };
}
