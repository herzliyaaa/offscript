import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import { RELATIONSHIP_CATEGORIES, RELATIONSHIP_STATUSES } from './world.utils.js';

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
    content: { type: 'string', maxLength: 180 },
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
      summary: { type: 'string', maxLength: 300 },
      openingScene: { type: 'string', maxLength: 900 },
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
      narration: { type: 'string', maxLength: 500 },
      summary: { type: 'string', maxLength: 180 },
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
            category: { type: 'string', enum: RELATIONSHIP_CATEGORIES },
            note: { type: 'string' },
          },
          required: ['character', 'delta', 'status', 'category', 'note'],
          additionalProperties: false,
        },
      },
      posts: { type: 'array', items: postSchema },
      newGoals: { type: 'array', items: { type: 'string' } },
      events: {
        type: 'array',
        maxItems: 1,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 80 },
            description: { type: 'string', maxLength: 240 },
            type: { type: 'string' },
            followerChange: { type: 'integer', minimum: -50000, maximum: 100000 },
            sourceName: { type: 'string' },
            sourceHandle: { type: 'string' },
            context: { type: 'string' },
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

const eventChoiceSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', maxLength: 40 },
    action: { type: 'string', maxLength: 120 },
  },
  required: ['label', 'action'],
  additionalProperties: false,
};

export function buildEventScenariosSchema() {
  return {
    type: 'object',
    properties: {
      scenario: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 80 },
          description: { type: 'string', maxLength: 450 },
          type: { type: 'string' },
          sourceName: { type: 'string' },
          sourceHandle: { type: 'string' },
          context: { type: 'string', maxLength: 120 },
          choices: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: eventChoiceSchema,
          },
        },
        required: [
          'title',
          'description',
          'type',
          'sourceName',
          'sourceHandle',
          'context',
          'choices',
        ],
        additionalProperties: false,
      },
    },
    required: ['scenario'],
    additionalProperties: false,
  };
}
