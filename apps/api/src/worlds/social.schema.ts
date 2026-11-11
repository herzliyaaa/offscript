import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import { statProperties } from './world.schema.js';
import { RELATIONSHIP_CATEGORIES, RELATIONSHIP_STATUSES } from './world.utils.js';

const reactionPostSchema = {
  type: 'object',
  properties: {
    author: { type: 'string' },
    content: { type: 'string', maxLength: 180 },
    kind: { type: 'string', enum: ['post', 'reply', 'quote', 'headline'] },
    likes: { type: 'integer', minimum: 0, maximum: 1000000 },
  },
  required: ['author', 'content', 'kind', 'likes'],
  additionalProperties: false,
};

const eventSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 80 },
    description: { type: 'string', maxLength: 240 },
    type: { type: 'string' },
    followerChange: { type: 'integer', minimum: -50000, maximum: 100000 },
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
    category: { type: 'string', enum: RELATIONSHIP_CATEGORIES },
    note: { type: 'string' },
  },
  required: ['character', 'delta', 'status', 'category', 'note'],
  additionalProperties: false,
};

export function buildPostReactionSchema(
  template: ScenarioTemplate,
  replyCount = 2,
) {
  return {
    type: 'object',
    properties: {
      postLikes: { type: 'integer', minimum: 0, maximum: 1000000 },
      replies: {
        type: 'array',
        minItems: replyCount,
        maxItems: replyCount,
        items: reactionPostSchema,
      },
      relationshipChanges: {
        type: 'array',
        maxItems: 5,
        items: relationshipChangeSchema,
      },
      events: { type: 'array', maxItems: 1, items: eventSchema },
      statChanges: {
        type: 'object',
        properties: statProperties(template.statLabels, true),
        required: template.statLabels,
        additionalProperties: false,
      },
      summary: { type: 'string', maxLength: 180 },
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
      reply: { type: 'string', maxLength: 240 },
      playerMessageRelationshipDelta: {
        type: 'integer',
        minimum: -20,
        maximum: 20,
      },
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
      summary: { type: 'string', maxLength: 180 },
    },
    required: [
      'reply',
      'playerMessageRelationshipDelta',
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
      title: { type: 'string', maxLength: 80 },
      description: { type: 'string', maxLength: 450 },
      type: { type: 'string' },
      followerChange: { type: 'integer', minimum: -50000, maximum: 100000 },
      posts: {
        type: 'array',
        minItems: 2,
        maxItems: 3,
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
      summary: { type: 'string', maxLength: 180 },
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
