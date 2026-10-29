import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import { statProperties } from './world.schema.js';
import { RELATIONSHIP_STATUSES } from './world.utils.js';

const reactionPostSchema = {
  type: 'object',
  properties: {
    author: { type: 'string' },
    content: { type: 'string' },
    kind: { type: 'string', enum: ['post', 'reply', 'quote', 'headline'] },
    likes: { type: 'integer', minimum: 0, maximum: 1000000 },
  },
  required: ['author', 'content', 'kind', 'likes'],
  additionalProperties: false,
};

const eventSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    type: { type: 'string' },
  },
  required: ['title', 'description', 'type'],
  additionalProperties: false,
};

const relationshipChangeSchema = {
  type: 'object',
  properties: {
    character: { type: 'string' },
    delta: { type: 'integer', minimum: -20, maximum: 20 },
    status: { type: 'string', enum: RELATIONSHIP_STATUSES },
    note: { type: 'string' },
  },
  required: ['character', 'delta', 'status', 'note'],
  additionalProperties: false,
};

export function buildPostReactionSchema(template: ScenarioTemplate) {
  return {
    type: 'object',
    properties: {
      postLikes: { type: 'integer', minimum: 0, maximum: 1000000 },
      replies: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        items: reactionPostSchema,
      },
      relationshipChanges: {
        type: 'array',
        maxItems: 5,
        items: relationshipChangeSchema,
      },
      events: { type: 'array', maxItems: 2, items: eventSchema },
      statChanges: {
        type: 'object',
        properties: statProperties(template.statLabels, true),
        required: template.statLabels,
        additionalProperties: false,
      },
      summary: { type: 'string' },
    },
    required: [
      'postLikes',
      'replies',
      'relationshipChanges',
      'events',
      'statChanges',
      'summary',
    ],
    additionalProperties: false,
  };
}

export function buildDmSchema() {
  return {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      relationshipDelta: {
        type: 'integer',
        minimum: -20,
        maximum: 20,
      },
      relationshipStatus: {
        type: 'string',
        enum: RELATIONSHIP_STATUSES,
      },
      note: { type: 'string' },
      events: { type: 'array', maxItems: 1, items: eventSchema },
      summary: { type: 'string' },
    },
    required: [
      'reply',
      'relationshipDelta',
      'relationshipStatus',
      'note',
      'events',
      'summary',
    ],
    additionalProperties: false,
  };
}

export function buildEventSchema(template: ScenarioTemplate) {
  return {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      type: { type: 'string' },
      posts: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: reactionPostSchema,
      },
      relationshipChanges: {
        type: 'array',
        maxItems: 5,
        items: relationshipChangeSchema,
      },
      statChanges: {
        type: 'object',
        properties: statProperties(template.statLabels, true),
        required: template.statLabels,
        additionalProperties: false,
      },
      summary: { type: 'string' },
    },
    required: [
      'title',
      'description',
      'type',
      'posts',
      'relationshipChanges',
      'statChanges',
      'summary',
    ],
    additionalProperties: false,
  };
}
