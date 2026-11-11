import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type {
  CharacterKind,
  CharacterPersona,
  CharacterMemory,
  DmSender,
  PostKind,
  RelationshipStatus,
  RelationshipCategory,
  WorldState,
} from '../worlds/world.types.js';

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const worlds = pgTable('worlds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  name: varchar({ length: 255 }).notNull(),
  scenarioKey: varchar('scenario_key', { length: 100 }).notNull(),
  playerName: varchar('player_name', { length: 255 }).notNull(),
  status: varchar({ length: 32 }).notNull().default('active'),
  turn: integer().notNull().default(0),
  state: jsonb().$type<WorldState>().notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const characters = pgTable(
  'characters',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    worldId: integer('world_id')
      .notNull()
      .references(() => worlds.id, { onDelete: 'cascade' }),
    name: varchar({ length: 255 }).notNull(),
    handle: varchar({ length: 50 }).notNull(),
    avatarUrl: text('avatar_url'),
    gender: varchar({ length: 64 }),
    kind: varchar({ length: 32 }).$type<CharacterKind>().notNull(),
    role: varchar({ length: 255 }).notNull(),
    bio: text().notNull(),
    additionalDescription: text('additional_description'),
    followerCount: integer('follower_count').notNull().default(0),
    memory: jsonb().$type<CharacterMemory[]>().notNull().default([]),
    goals: jsonb().$type<string[]>().notNull().default([]),
    mood: varchar({ length: 64 }).notNull().default('curious'),
    persona: jsonb().$type<CharacterPersona>().notNull(),
    stats: jsonb().$type<Record<string, number>>().notNull(),
    isPlayer: boolean('is_player').notNull().default(false),
    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('characters_world_handle_unique').on(
      table.worldId,
      table.handle,
    ),
  ],
);

export const posts = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id')
    .notNull()
    .references(() => worlds.id, { onDelete: 'cascade' }),
  characterId: integer('character_id').references(() => characters.id, {
    onDelete: 'set null',
  }),
  parentId: integer('parent_id').references((): AnyPgColumn => posts.id, {
    onDelete: 'cascade',
  }),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  authorHandle: varchar('author_handle', { length: 50 }).notNull(),
  authorKind: varchar('author_kind', { length: 32 })
    .$type<CharacterKind>()
    .notNull(),
  content: text().notNull(),
  kind: varchar({ length: 32 }).$type<PostKind>().notNull().default('post'),
  likes: integer().notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  turn: integer().notNull().default(0),
  meta: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const postInteractions = pgTable(
  'post_interactions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'cascade' }),
    postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    type: varchar({ length: 16 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('post_interactions_world_post_type_unique').on(
      table.worldId,
      table.postId,
      table.type,
    ),
  ],
);

export const relationships = pgTable(
  'relationships',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    worldId: integer('world_id')
      .notNull()
      .references(() => worlds.id, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    level: integer().notNull().default(0),
    status: varchar({ length: 32 })
      .$type<RelationshipStatus>()
      .notNull()
      .default('neutral'),
    category: varchar('category', { length: 32 })
      .$type<RelationshipCategory>()
      .notNull()
      .default('neutral'),
    note: text().notNull().default(''),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('relationships_world_character_unique').on(
      table.worldId,
      table.characterId,
    ),
  ],
);

export const relationshipMilestones = pgTable('relationship_milestones', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'cascade' }),
  characterId: integer('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  turn: integer().notNull(),
  previousStatus: varchar('previous_status', { length: 32 }).notNull(),
  nextStatus: varchar('next_status', { length: 32 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  note: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'cascade' }),
  type: varchar({ length: 32 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  href: text(),
  read: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const directMessages = pgTable('direct_messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id')
    .notNull()
    .references(() => worlds.id, { onDelete: 'cascade' }),
  characterId: integer('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  sender: varchar({ length: 16 }).$type<DmSender>().notNull(),
  content: text().notNull(),
  turn: integer().notNull(),
  read: boolean().notNull().default(false),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const moderationReports = pgTable('moderation_reports', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'cascade' }),
  reporterCharacterId: integer('reporter_character_id').references(() => characters.id, { onDelete: 'set null' }),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  characterId: integer('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  reason: varchar({ length: 64 }).notNull(),
  details: text().notNull().default(''),
  status: varchar({ length: 32 }).notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const moderationBlocks = pgTable(
  'moderation_blocks',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'cascade' }),
    characterId: integer('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
    blockedCharacterId: integer('blocked_character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
    kind: varchar({ length: 16 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('moderation_blocks_unique').on(table.worldId, table.characterId, table.blockedCharacterId, table.kind),
  ],
);

export const worldEvents = pgTable('world_events', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  worldId: integer('world_id')
    .notNull()
    .references(() => worlds.id, { onDelete: 'cascade' }),
  turn: integer().notNull(),
  type: varchar({ length: 32 }).notNull(),
  title: varchar({ length: 255 }).notNull().default(''),
  content: text().notNull(),
  meta: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
