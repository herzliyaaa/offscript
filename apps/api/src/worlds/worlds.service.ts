import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  desc,
  eq,
  sql,
  type ExtractTablesWithRelations,
} from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { AiService } from '../ai/ai.service.js';
import { DATABASE } from '../db/database.provider.js';
import * as schema from '../db/schema.js';
import { findScenario } from '../scenarios/scenario.catalog.js';
import type { ScenarioTemplate } from '../scenarios/scenario.types.js';
import type {
  CreatePostDto,
  CreateCharacterDto,
  CreateWorldDto,
  GenerateEventDto,
  SendDmDto,
  UpdateCharacterDto,
  PostInteractionDto,
} from './dto/world.dto.js';
import { CELEBRITY_PRESETS, findCelebrityPreset } from './celebrity.presets.js';
import {
  buildDmPrompt,
  buildEventPrompt,
  buildPostReactionPrompt,
} from './social.prompt.js';
import {
  buildDmSchema,
  buildEventSchema,
  buildPostReactionSchema,
} from './social.schema.js';
import { buildStanAccounts } from './stan.accounts.js';
import {
  buildTurnPrompt,
  buildEventScenariosPrompt,
  buildWorldGenerationPrompt,
  WORLD_SYSTEM_PROMPT,
  type RecentPostContext,
} from './world.prompt.js';
import {
  buildEventScenariosSchema,
  buildTurnSchema,
  buildWorldSchema,
} from './world.schema.js';
import type {
  ActorContext,
  GeneratedDmReply,
  GeneratedPost,
  GeneratedReaction,
  GeneratedTurn,
  GeneratedWorld,
  GeneratedWorldEvent,
  GeneratedEventScenario,
  RelationshipChange,
  RelationshipContext,
  RelationshipStatus,
  WorldState,
  AvatarUpload,
} from './world.types.js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  clamp,
  normalizeFeedKind,
  normalizeRelationshipStatus,
  normalizeStats,
  statusForLevel,
  uniqueHandle,
} from './world.utils.js';

const MAX_FEED = 30;
const RECENT_FEED_FOR_AI = 10;

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

type Db = NodePgDatabase<typeof schema>;
type Tx = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type CharacterRow = typeof schema.characters.$inferSelect;
type PostRow = typeof schema.posts.$inferSelect;
type FeedPost = PostRow & {
  repostCount: number;
  quoteCount: number;
  liked: boolean;
  reposted: boolean;
};
type RelationshipRow = typeof schema.relationships.$inferSelect;

@Injectable()
export class WorldsService {
  constructor(
    @Inject(DATABASE)
    private readonly db: Db,
    private readonly ai: AiService,
  ) {}

  async saveAvatar(
    file: AvatarUpload | undefined,
    publicOrigin: string,
  ) {
    if (!file) {
      throw new BadRequestException('An avatar image is required.');
    }

    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const extension = extensions[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Avatar must be a JPEG, PNG, WebP, or GIF image.');
    }
    if (file.size > 1_500_000) {
      throw new BadRequestException('Avatar must be smaller than 1.5 MB.');
    }

    const directory = path.resolve(process.cwd(), 'avatars');
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(path.join(directory, filename), file.buffer);

    return { url: `${publicOrigin}/avatars/${filename}` };
  }

  async create(dto: CreateWorldDto) {
    const template = this.getScenario(dto.scenarioKey);
    const playerName = dto.playerName;
    const playerHandle = dto.playerHandle;
    const playerPersona = dto.playerPersona;
    const selectedCelebrities = (dto.associatedCelebrityKeys ?? [])
      .map((key) => findCelebrityPreset(key))
      .filter((preset): preset is NonNullable<typeof preset> => Boolean(preset));

    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<GeneratedWorld>(
      buildWorldGenerationPrompt(template, {
        playerName,
        playerPersona,
        worldName: dto.name,
      }),
      buildWorldSchema(template),
      { system: WORLD_SYSTEM_PROMPT, temperature: 0.9 },
    );

    const state: WorldState = {
      summary: generated.summary,
      currentScene: generated.openingScene,
      playerStats: normalizeStats(generated.playerStats, template.statLabels),
      goals: (generated.goals ?? []).slice(0, 3),
      flags: [],
    };

    const worldName =
      this.clip(dto.name, 255) ||
      this.clip(generated.worldName, 255) ||
      template.title;

    const usedHandles = new Set<string>();
    const resolvedPlayerHandle = uniqueHandle(playerHandle, playerName, usedHandles);
    const cast = (generated.cast ?? [])
      .filter((member) => member.name?.trim())
      .slice(0, 5);
    const stanSeeds = buildStanAccounts(playerName, usedHandles);

    const created = await this.db.transaction(async (tx) => {
      const [world] = await tx
        .insert(schema.worlds)
        .values({
          userId: dto.userId ?? null,
          name: worldName,
          scenarioKey: template.key,
          playerName,
          turn: 0,
          state,
        })
        .returning();

      const [player] = await tx
        .insert(schema.characters)
        .values({
          worldId: world.id,
          name: playerName,
          handle: resolvedPlayerHandle,
          avatarUrl: dto.playerAvatarUrl ?? null,
          gender: dto.playerGender ?? null,
          kind: 'player',
          role: template.playerRole,
          bio: playerPersona ?? `The player of ${template.title}.`,
          additionalDescription:
            dto.playerAdditionalDescription ?? null,
          followerCount: dto.playerFollowerCount ?? 0,
          persona: {
            personality:
              playerPersona ??
              'Driven, observant, and still learning the rules.',
            publicPersona: playerPersona ?? template.playerRole,
            secret: 'Only you know what you are willing to sacrifice.',
            voice: 'Your own.',
          },
          stats: state.playerStats,
          isPlayer: true,
        })
        .returning();

        const selectedCast = selectedCelebrities.length
          ? selectedCelebrities.map((preset) => ({
              name: preset.name,
              handle: preset.handle,
              role: preset.role,
              bio: preset.bio,
              personality: preset.personality,
              publicPersona: preset.publicPersona,
              secret: 'Their public image is only part of the story.',
              voice: preset.voice,
            }))
          : cast;
        const castRows = selectedCast.length
          ? await tx
              .insert(schema.characters)
              .values(
                selectedCast.map((member) => ({
                worldId: world.id,
                name: this.clip(member.name, 255),
                handle: uniqueHandle(member.handle, member.name, usedHandles),
                kind: 'celebrity' as const,
                role: this.clip(member.role, 255) || 'Celebrity',
                bio: member.bio ?? '',
                persona: {
                  personality: member.personality ?? '',
                  publicPersona: member.publicPersona ?? '',
                  secret: member.secret ?? '',
                  voice: member.voice ?? '',
                },
                stats: normalizeStats({}, template.statLabels),
                isPlayer: false,
              })),
            )
            .returning()
        : [];

      const stanRows = await tx
        .insert(schema.characters)
        .values(
          stanSeeds.map((seed) => ({
            worldId: world.id,
            name: this.clip(seed.name, 255),
            handle: seed.handle,
            kind: 'stan' as const,
            role: seed.role,
            bio: seed.bio,
            persona: seed.persona,
            stats: normalizeStats({}, template.statLabels),
            isPlayer: false,
          })),
        )
        .returning();

      if (castRows.length) {
        await tx.insert(schema.relationships).values(
          castRows.map((member) => ({
            worldId: world.id,
            characterId: member.id,
            level: 0,
            status: 'neutral' as const,
            note: 'Just met.',
          })),
        );
      }

      const actors = [player, ...castRows, ...stanRows];
      const openingPosts = (generated.openingPosts ?? [])
        .filter((post) => post.content?.trim())
        .slice(0, 6);

      const feed = await this.insertActorPosts(
        tx,
        world.id,
        0,
        openingPosts,
        actors,
        null,
      );

      await tx.insert(schema.worldEvents).values({
        worldId: world.id,
        turn: 0,
        type: 'opening',
        title: 'Opening Scene',
        content: generated.openingScene,
        meta: { summary: generated.summary },
      });

      return {
        world,
        player: this.publicCharacter(player),
        cast: castRows.map((member) => this.publicCharacter(member)),
        stanAccounts: stanRows.map((member) => this.publicCharacter(member)),
        feed,
      };
    });

    return {
      ...created,
      relationships: await this.listRelationships(created.world.id),
      durationMs: Date.now() - aiStartedAt,
    };
  }

  async list(userId?: number) {
    return this.db
      .select()
      .from(schema.worlds)
      .where(userId ? eq(schema.worlds.userId, userId) : undefined)
      .orderBy(desc(schema.worlds.updatedAt));
  }

  listCelebrityPresets() {
    return CELEBRITY_PRESETS.map(({ personality, publicPersona, voice, ...preset }) => preset);
  }

  async updateCharacter(worldId: number, characterId: number, dto: UpdateCharacterDto) {
    await this.ensureWorld(worldId);
    const [character] = await this.db
      .select()
      .from(schema.characters)
      .where(
        and(
          eq(schema.characters.worldId, worldId),
          eq(schema.characters.id, characterId),
        ),
      );

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found in world ${worldId}`);
    }

    const [updated] = await this.db
      .update(schema.characters)
      .set({
        name: dto.name?.trim() || character.name,
        handle: dto.handle?.trim() || character.handle,
        gender: dto.gender ?? character.gender,
        bio: dto.bio ?? character.bio,
        additionalDescription:
          dto.additionalDescription ?? character.additionalDescription,
        followerCount: dto.followerCount ?? character.followerCount,
        avatarUrl: dto.avatarUrl ?? character.avatarUrl,
      })
      .where(eq(schema.characters.id, characterId))
      .returning();

    if (updated.isPlayer && updated.name !== (await this.ensureWorld(worldId)).playerName) {
      await this.db
        .update(schema.worlds)
        .set({ playerName: updated.name, updatedAt: new Date() })
        .where(eq(schema.worlds.id, worldId));
    }

    return this.publicCharacter(updated);
  }

  async createCharacter(worldId: number, dto: CreateCharacterDto) {
    await this.ensureWorld(worldId);
    const handle = dto.handle.trim().startsWith('@')
      ? dto.handle.trim()
      : `@${dto.handle.trim()}`;
    const existing = await this.db
      .select({ id: schema.characters.id })
      .from(schema.characters)
      .where(and(eq(schema.characters.worldId, worldId), eq(schema.characters.handle, handle)));
    if (existing.length) {
      throw new BadRequestException(`Handle ${handle} is already used in this world.`);
    }

    const [character] = await this.db
      .insert(schema.characters)
      .values({
        worldId,
        name: dto.name.trim(),
        handle,
        avatarUrl: dto.avatarUrl ?? null,
        gender: dto.gender,
        kind: 'custom',
        role: dto.bio.trim().split(/[.!?]/)[0].slice(0, 255) || 'New connection',
        bio: dto.bio.trim(),
        additionalDescription: dto.additionalDescription?.trim() || null,
        followerCount: dto.followerCount,
        persona: {
          personality: dto.additionalDescription?.trim() || 'Still figuring things out.',
          publicPersona: dto.bio?.trim() || 'A new face in the world.',
          secret: 'They have more going on than they let on.',
          voice: 'Casual, direct, and conversational.',
        },
        stats: {},
        isPlayer: false,
      })
      .returning();

    await this.db.insert(schema.relationships).values({
      worldId,
      characterId: character.id,
      level: 0,
      status: 'neutral',
      note: dto.additionalDescription?.trim() || 'A new connection in this world.',
    });

    return this.publicCharacter(character);
  }

  async get(id: number) {
    const world = await this.ensureWorld(id);

    const [characters, feed, events, relationships, relationshipMilestones, unreadNotifications] = await Promise.all([
      this.getCharacters(id),
      this.getRecentPosts(id, MAX_FEED),
      this.listEvents(id, 10),
      this.listRelationships(id),
      this.listRelationshipMilestones(id),
      this.countUnreadNotifications(id),
    ]);

    const player = characters.find((character) => character.isPlayer);

    return {
      ...world,
      player: player ? this.publicCharacter(player) : null,
      cast: characters
        .filter((character) => character.kind === 'celebrity' || character.kind === 'custom')
        .map((character) => this.publicCharacter(character)),
      stanAccounts: characters
        .filter((character) => character.kind === 'stan')
        .map((character) => this.publicCharacter(character)),
      feed,
      events,
      relationships,
      relationshipMilestones,
      unreadNotifications,
    };
  }

  async listNotifications(worldId: number) {
    await this.ensureWorld(worldId);
    const rows = await this.db
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        title: schema.notifications.title,
        body: schema.notifications.body,
        href: schema.notifications.href,
        read: schema.notifications.read,
        createdAt: schema.notifications.createdAt,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.worldId, worldId))
      .orderBy(desc(schema.notifications.id))
      .limit(50);
    return {
      notifications: rows,
      unreadCount: rows.filter((notification) => !notification.read).length,
    };
  }

  async markNotificationsRead(worldId: number) {
    await this.ensureWorld(worldId);
    const updated = await this.db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.worldId, worldId), eq(schema.notifications.read, false)))
      .returning({ id: schema.notifications.id });
    return { updated: updated.length };
  }

  async feed(id: number, limit = MAX_FEED) {
    await this.ensureWorld(id);
    return this.getRecentPosts(id, limit);
  }

  async getPost(id: number, postId: number) {
    const post = await this.getPostRow(id, postId);
    const replies = await this.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.parentId, postId))
      .orderBy(schema.posts.id);

    return { post, replies };
  }

  async interactWithPost(
    worldId: number,
    postId: number,
    type: PostInteractionDto['type'],
  ) {
    await this.ensureWorld(worldId);
    await this.getPostRow(worldId, postId);
    const existing = await this.db
      .select()
      .from(schema.postInteractions)
      .where(and(
        eq(schema.postInteractions.worldId, worldId),
        eq(schema.postInteractions.postId, postId),
        eq(schema.postInteractions.type, type),
      ));

    if (existing.length) {
      await this.db.delete(schema.postInteractions).where(eq(schema.postInteractions.id, existing[0].id));
    } else {
      await this.db.insert(schema.postInteractions).values({ worldId, postId, type });
    }

    const interactions = await this.db
      .select()
      .from(schema.postInteractions)
      .where(and(eq(schema.postInteractions.worldId, worldId), eq(schema.postInteractions.postId, postId)));
    return {
      active: !existing.length,
      type,
      likeCount: interactions.filter((item) => item.type === 'like').length,
      repostCount: interactions.filter((item) => item.type === 'repost').length,
    };
  }

  async createPost(id: number, dto: CreatePostDto) {
    const world = await this.ensureWorld(id);
    const template = this.getScenario(world.scenarioKey);
    const characters = await this.getCharacters(id);
    const player = characters.find((character) => character.isPlayer);

    if (!player) {
      throw new NotFoundException('Player character not found');
    }

    const parent = (dto.parentId ?? dto.quotePostId)
      ? await this.getPostRow(id, dto.parentId ?? dto.quotePostId!)
      : null;
    const [recent, relationships] = await Promise.all([
      this.getRecentPosts(id, RECENT_FEED_FOR_AI),
      this.relationshipContext(id),
    ]);
    const allActors = characters.filter(
      (character) => character.kind !== 'player',
    );
    const relatedHandles = new Set(
      relationships.map((relationship) =>
        relationship.handle.replace(/^@/, '').toLowerCase(),
      ),
    );
    const actors = [
      ...allActors.filter((actor) =>
        relatedHandles.has(actor.handle.replace(/^@/, '').toLowerCase()),
      ),
      ...allActors.filter(
        (actor) =>
          !relatedHandles.has(actor.handle.replace(/^@/, '').toLowerCase()),
      ),
    ];
    const nextTurn = world.turn + 1;

    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<GeneratedReaction>(
      buildPostReactionPrompt(
        template,
        {
          playerName: world.playerName,
          turn: nextTurn,
          state: world.state,
        },
        { name: player.name, handle: player.handle },
        this.toActorContexts(actors.slice(0, 8)),
        relationships.slice(0, 8),
        recent.slice(0, 5).map((post) => this.toRecentPost(post)),
        { content: dto.content, turn: nextTurn },
        parent
          ? { authorHandle: parent.authorHandle, content: parent.content }
          : null,
      ),
      buildPostReactionSchema(template),
      {
        model: this.ai.fastModelName,
        system: WORLD_SYSTEM_PROMPT,
        temperature: 0.9,
        numCtx: 1536,
        maxTokens: parent ? 512 : 640,
      },
    );

    const relatedActors = actors.filter((actor) =>
      relatedHandles.has(actor.handle.replace(/^@/, '').toLowerCase()),
    );
    const generatedReplies = [...(generated.replies ?? [])];
    if (relatedActors.length > 0) {
      const requiredRelatedReplies = Math.min(2, relatedActors.length);
      for (let index = 0; index < requiredRelatedReplies; index += 1) {
        const actor = relatedActors[index];
        const hasReply = generatedReplies.some(
          (reply) =>
            reply.author.replace(/^@/, '').toLowerCase() ===
            actor.handle.replace(/^@/, '').toLowerCase(),
        );
        if (!hasReply) {
          const replacementIndex = generatedReplies.findIndex(
            (reply) =>
              !relatedHandles.has(
                reply.author.replace(/^@/, '').toLowerCase(),
              ),
          );
          if (replacementIndex >= 0) {
            generatedReplies[replacementIndex] = {
              ...generatedReplies[replacementIndex],
              author: actor.handle,
            };
          } else {
            generatedReplies.push({
              author: actor.handle,
              content: `wait, I saw this. we should talk lol`,
              kind: 'reply',
              likes: 0,
            });
          }
        }
      }
    }

    const state = this.applyStatChanges(
      world.state,
      generated.statChanges,
      template,
    );

    const result = await this.db.transaction(async (tx) => {
      const [playerPost] = await tx
        .insert(schema.posts)
        .values({
          worldId: id,
          characterId: player.id,
          parentId: parent?.id ?? null,
          authorName: player.name,
          authorHandle: player.handle,
          authorKind: player.kind,
          content: dto.content,
          kind: dto.quotePostId ? 'quote' : parent ? 'reply' : 'post',
          likes: clamp(Math.round(generated.postLikes ?? 0), 0, 1_000_000),
          turn: nextTurn,
          meta: {
            ...(dto.quotePostId ? { quotedPostId: dto.quotePostId } : {}),
            mentions: [...dto.content.matchAll(/@([a-zA-Z0-9_]+)/g)].map((match) => match[1]),
          },
        })
        .returning();

      if (parent) {
        await tx
          .update(schema.posts)
          .set({ replyCount: sql`${schema.posts.replyCount} + 1` })
          .where(eq(schema.posts.id, parent.id));
      }

      const replies = await this.insertActorPosts(
        tx,
        id,
        nextTurn,
        generatedReplies,
        actors,
        playerPost.id,
      );
      await this.insertEvents(tx, id, nextTurn, generated.events ?? []);
      await this.applyRelationshipChanges(
        tx,
        id,
        generated.relationshipChanges ?? [],
        characters,
      );

      const [updated] = await tx
        .update(schema.worlds)
        .set({
          turn: nextTurn,
          state: {
            ...state,
            summary: generated.summary?.trim() || state.summary,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.worlds.id, id))
        .returning();

      return {
        world: updated,
        post: { ...playerPost, replyCount: replies.length },
        replies,
      };
    });

    return {
      ...result,
      events: generated.events ?? [],
      relationships: await this.listRelationships(id),
      durationMs: Date.now() - aiStartedAt,
    };
  }

  async listDms(id: number, characterId: number, limit = 100) {
    await this.ensureWorld(id);
    const character = await this.getCharacter(id, characterId);

    await this.db
      .update(schema.directMessages)
      .set({ read: true })
      .where(
        and(
          eq(schema.directMessages.worldId, id),
          eq(schema.directMessages.characterId, characterId),
          eq(schema.directMessages.sender, 'character'),
          eq(schema.directMessages.read, false),
        ),
      );

    const messages = await this.db
      .select()
      .from(schema.directMessages)
      .where(
        and(
          eq(schema.directMessages.worldId, id),
          eq(schema.directMessages.characterId, characterId),
        ),
      )
      .orderBy(desc(schema.directMessages.id))
      .limit(clamp(limit, 1, 200));

    const relationship =
      (await this.listRelationships(id)).find(
        (row) => row.characterId === characterId,
      ) ?? null;

    return {
      character: this.publicCharacter(character),
      relationship,
      messages: [...messages].reverse(),
    };
  }

  async listConversations(id: number) {
    await this.ensureWorld(id);
    const [characters, relationships, messages] = await Promise.all([
      this.getCharacters(id),
      this.listRelationships(id),
      this.db
        .select()
        .from(schema.directMessages)
        .where(eq(schema.directMessages.worldId, id))
        .orderBy(desc(schema.directMessages.id))
        .limit(500),
    ]);

    const celebrities = characters.filter(
      (character) => character.kind === 'celebrity',
    );
    const latest = new Map<number, (typeof messages)[number]>();

    for (const message of messages) {
      if (!latest.has(message.characterId)) {
        latest.set(message.characterId, message);
      }
    }

    return celebrities
      .map((character) => ({
        character: this.publicCharacter(character),
        relationship:
          relationships.find((row) => row.characterId === character.id) ?? null,
        lastMessage: latest.get(character.id) ?? null,
        unreadCount: messages.filter(
          (message) =>
            message.characterId === character.id &&
            message.sender === 'character' &&
            !message.read,
        ).length,
      }))
      .sort(
        (a, b) =>
          (b.lastMessage?.id ?? 0) - (a.lastMessage?.id ?? 0) ||
          a.character.name.localeCompare(b.character.name),
      );
  }

  async sendDm(id: number, characterId: number, dto: SendDmDto) {
    const world = await this.ensureWorld(id);
    const template = this.getScenario(world.scenarioKey);
    const characters = await this.getCharacters(id);
    const player = characters.find((character) => character.isPlayer);

    if (!player) {
      throw new NotFoundException('Player character not found');
    }

    const character = characters.find(
      (row) => row.id === characterId && row.kind === 'celebrity',
    );

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    const relationshipRow = await this.getRelationshipRow(id, characterId);
    const relationship: RelationshipContext = relationshipRow
      ? {
          character: character.name,
          handle: character.handle,
          level: relationshipRow.level,
          status: relationshipRow.status,
          note: relationshipRow.note,
        }
      : {
          character: character.name,
          handle: character.handle,
          level: 0,
          status: 'neutral',
          note: 'Just met.',
        };

    const history = await this.db
      .select()
      .from(schema.directMessages)
      .where(
        and(
          eq(schema.directMessages.worldId, id),
          eq(schema.directMessages.characterId, characterId),
        ),
      )
      .orderBy(desc(schema.directMessages.id))
      .limit(5);
    const nextTurn = world.turn + 1;

    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<GeneratedDmReply>(
      buildDmPrompt(
        template,
        {
          playerName: world.playerName,
          turn: nextTurn,
          state: world.state,
        },
        { name: player.name, handle: player.handle },
        this.toActorContext(character),
        relationship,
        [...history].reverse().map((message) => ({
          sender: message.sender,
          content: message.content,
        })),
        dto.content,
      ),
      buildDmSchema(),
      {
        system: WORLD_SYSTEM_PROMPT,
        model: this.ai.fastModelName,
        temperature: 0.9,
        numCtx: 2048,
        maxTokens: 400,
      },
    );

    const result = await this.db.transaction(async (tx) => {
      const [playerMessage] = await tx
        .insert(schema.directMessages)
        .values({
          worldId: id,
          characterId,
          sender: 'player',
          content: dto.content,
          turn: nextTurn,
          read: true,
        })
        .returning();

      const [characterMessage] = await tx
        .insert(schema.directMessages)
        .values({
          worldId: id,
          characterId,
          sender: 'character',
          content: generated.reply,
          turn: nextTurn,
        })
        .returning();

      await tx.insert(schema.notifications).values({
        worldId: id,
        type: 'message',
        title: `New message from ${character.name}`,
        body: generated.reply,
        href: `/worlds/${id}/messages`,
      });

      await this.applyRelationshipChange(
        tx,
        id,
        character,
        generated.relationshipDelta,
        generated.relationshipStatus,
        generated.note,
      );
      await this.insertEvents(tx, id, nextTurn, generated.events ?? []);

      const [updated] = await tx
        .update(schema.worlds)
        .set({
          turn: nextTurn,
          state: {
            ...world.state,
            summary: generated.summary?.trim() || world.state.summary,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.worlds.id, id))
        .returning();

      return { world: updated, messages: [playerMessage, characterMessage] };
    });

    const relationships = await this.listRelationships(id);

    return {
      ...result,
      character: this.publicCharacter(character),
      events: generated.events ?? [],
      relationship:
        relationships.find((row) => row.characterId === characterId) ?? null,
      durationMs: Date.now() - aiStartedAt,
    };
  }

  async generateEvent(id: number, dto: GenerateEventDto) {
    const world = await this.ensureWorld(id);
    const template = this.getScenario(world.scenarioKey);
    const characters = await this.getCharacters(id);
    const player = characters.find((character) => character.isPlayer);

    if (!player) {
      throw new NotFoundException('Player character not found');
    }

    const actors = characters.filter(
      (character) => character.kind !== 'player',
    );
    const [relationships, recentEvents] = await Promise.all([
      this.relationshipContext(id),
      this.listEvents(id, 5),
    ]);
    const nextTurn = world.turn + 1;

    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<GeneratedWorldEvent>(
      buildEventPrompt(
        template,
        {
          playerName: world.playerName,
          turn: nextTurn,
          state: world.state,
        },
        { name: player.name, handle: player.handle },
        this.toActorContexts(actors),
        relationships,
        recentEvents.map((event) => ({
          title: event.title,
          content: event.content,
        })),
        { type: dto.type, prompt: dto.prompt },
      ),
      buildEventSchema(template),
      {
        system: WORLD_SYSTEM_PROMPT,
        temperature: 0.95,
        numCtx: 2048,
        maxTokens: 1024,
      },
    );

    const state = this.applyStatChanges(
      world.state,
      generated.statChanges,
      template,
    );

    const result = await this.db.transaction(async (tx) => {
      const [event] = await tx
        .insert(schema.worldEvents)
        .values({
          worldId: id,
          turn: nextTurn,
          type: generated.type || 'event',
          title: this.clip(generated.title, 255),
          content: generated.description,
          meta: {},
        })
        .returning();

      const posts = await this.insertActorPosts(
        tx,
        id,
        nextTurn,
        generated.posts ?? [],
        actors,
        null,
      );
      await this.applyRelationshipChanges(
        tx,
        id,
        generated.relationshipChanges ?? [],
        characters,
      );

      const [updated] = await tx
        .update(schema.worlds)
        .set({
          turn: nextTurn,
          state: {
            ...state,
            summary: generated.summary?.trim() || state.summary,
            currentScene: generated.description?.trim() || state.currentScene,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.worlds.id, id))
        .returning();

      return { world: updated, event, posts };
    });

    return {
      ...result,
      relationships: await this.listRelationships(id),
      durationMs: Date.now() - aiStartedAt,
    };
  }

  async generateEventScenarios(id: number) {
    const world = await this.ensureWorld(id);
    const template = this.getScenario(world.scenarioKey);
    const characters = await this.getCharacters(id);
    const player = characters.find((character) => character.isPlayer);

    if (!player) {
      throw new NotFoundException('Player character not found');
    }

    const actors = characters.filter((character) => character.kind !== 'player');
    const relationships = await this.relationshipContext(id);
    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<{
      scenario: GeneratedEventScenario;
    }>(
      buildEventScenariosPrompt(
        template,
        { playerName: world.playerName, turn: world.turn + 1, state: world.state },
        { name: player.name, handle: player.handle },
        this.toActorContexts(actors),
        relationships,
      ),
      buildEventScenariosSchema(),
      {
        system: WORLD_SYSTEM_PROMPT,
        model: this.ai.fastModelName,
        temperature: 0.95,
        numCtx: 2048,
        maxTokens: 1200,
      },
    );

    if (!generated.scenario || generated.scenario.choices.length < 3) {
      throw new BadRequestException(
        'The simulation did not produce a complete event scenario. Please try again.',
      );
    }

    return {
      scenario: {
        id: `${id}-${world.turn}-${Date.now()}`,
        type: generated.scenario.type || 'event',
        sourceName: generated.scenario.sourceName,
        sourceHandle: generated.scenario.sourceHandle,
        context: generated.scenario.context,
        title: generated.scenario.title,
        description: generated.scenario.description,
        choices: generated.scenario.choices.slice(0, 3),
      },
      durationMs: Date.now() - aiStartedAt,
    };
  }

  async listEvents(id: number, limit = 20) {
    await this.ensureWorld(id);
    return this.db
      .select()
      .from(schema.worldEvents)
      .where(eq(schema.worldEvents.worldId, id))
      .orderBy(desc(schema.worldEvents.id))
      .limit(clamp(limit, 1, 100));
  }

  async act(id: number, action: string) {
    const world = await this.ensureWorld(id);
    const template = this.getScenario(world.scenarioKey);
    const characters = await this.getCharacters(id);
    const actors = characters.filter(
      (character) => character.kind !== 'player',
    );
    const [recent, relationships] = await Promise.all([
      this.getRecentPosts(id, RECENT_FEED_FOR_AI),
      this.relationshipContext(id),
    ]);
    const nextTurn = world.turn + 1;

    const aiStartedAt = Date.now();
    const generated = await this.ai.generateObject<GeneratedTurn>(
      buildTurnPrompt(
        template,
        {
          playerName: world.playerName,
          turn: nextTurn,
          state: world.state,
        },
        this.toActorContexts(actors),
        relationships,
        recent.map((post) => this.toRecentPost(post)),
        action,
      ),
      buildTurnSchema(template),
      { system: WORLD_SYSTEM_PROMPT, temperature: 0.9 },
    );

    const state = this.applyStatChanges(
      world.state,
      generated.statChanges,
      template,
    );

    const updated = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(schema.worlds)
        .set({
          turn: nextTurn,
          state: {
            ...state,
            summary: generated.summary?.trim() || state.summary,
            currentScene: generated.narration?.trim() || state.currentScene,
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.worlds.id, id))
        .returning();

      const posts = await this.insertActorPosts(
        tx,
        id,
        nextTurn,
        generated.posts ?? [],
        actors,
        null,
      );
      await this.insertEvents(tx, id, nextTurn, generated.events ?? []);
      await this.applyRelationshipChanges(
        tx,
        id,
        generated.relationshipChanges ?? [],
        characters,
      );

      await tx.insert(schema.worldEvents).values([
        {
          worldId: id,
          turn: nextTurn,
          type: 'action',
          title: 'Action',
          content: action,
        },
        {
          worldId: id,
          turn: nextTurn,
          type: 'narration',
          title: 'Narration',
          content: generated.narration,
          meta: { summary: generated.summary },
        },
      ]);

      return { world: row, posts };
    });

    return {
      world: updated.world,
      turn: nextTurn,
      narration: generated.narration,
      posts: updated.posts,
      statChanges: generated.statChanges ?? {},
      relationshipChanges: generated.relationshipChanges ?? [],
      newGoals: generated.newGoals ?? [],
      events: generated.events ?? [],
      relationships: await this.listRelationships(id),
      durationMs: Date.now() - aiStartedAt,
    };
  }

  private async insertActorPosts(
    tx: Tx,
    worldId: number,
    turn: number,
    posts: GeneratedPost[],
    actors: CharacterRow[],
    parentId: number | null,
  ): Promise<PostRow[]> {
    const valid = posts.filter((post) => post.content?.trim()).slice(0, 8);

    if (!valid.length) {
      return [];
    }

    const rows = await tx
      .insert(schema.posts)
      .values(
        valid.map((post) => {
          const actor = this.resolveActor(post.author, actors);
          return {
            worldId,
            characterId: actor?.id ?? null,
            parentId,
            authorName:
              actor?.name ?? (this.clip(post.author, 255) || 'Anonymous'),
            authorHandle:
              actor?.handle ??
              `@${this.clip(post.author, 40).replace(/^@+/, '') || 'anonymous'}`,
            authorKind: actor?.kind ?? ('stan' as const),
            content: post.content,
            kind: normalizeFeedKind(post.kind),
            likes: clamp(Math.round(post.likes ?? 0), 0, 1_000_000),
            turn,
          };
        }),
      )
      .returning();

    if (parentId) {
      await tx
        .update(schema.posts)
        .set({ replyCount: sql`${schema.posts.replyCount} + ${rows.length}` })
        .where(eq(schema.posts.id, parentId));
    }

    return rows;
  }

  private async insertEvents(
    tx: Tx,
    worldId: number,
    turn: number,
    events: GeneratedWorldEvent[] | GeneratedTurn['events'],
  ): Promise<void> {
    const valid = events.filter((event) => event.description?.trim());

    if (!valid.length) {
      return;
    }

    await tx.insert(schema.worldEvents).values(
      valid.map((event) => ({
        worldId,
        turn,
        type: event.type || 'event',
        title: this.clip(event.title, 255),
        content: event.description,
        meta: {},
      })),
    );

    await tx.insert(schema.notifications).values(
      valid.map((event) => ({
        worldId,
        type: 'event',
        title: event.title?.trim() || 'A new world event',
        body: event.description,
        href: `/worlds/${worldId}?tab=events`,
      })),
    );
  }

  private applyStatChanges(
    state: WorldState,
    changes: Record<string, number> | undefined,
    template: ScenarioTemplate,
  ): WorldState {
    const playerStats = { ...state.playerStats };

    for (const label of template.statLabels) {
      const delta = changes?.[label];

      if (typeof delta === 'number' && Number.isFinite(delta)) {
        playerStats[label] = clamp(
          (playerStats[label] ?? 50) + Math.round(delta),
          0,
          100,
        );
      }
    }

    return { ...state, playerStats };
  }

  private async applyRelationshipChanges(
    tx: Tx,
    worldId: number,
    changes: RelationshipChange[],
    characters: CharacterRow[],
  ): Promise<void> {
    const celebrities = characters.filter(
      (character) => character.kind === 'celebrity',
    );

    for (const change of changes) {
      if (!change?.character) {
        continue;
      }

      const character = this.resolveActor(change.character, celebrities);

      if (!character) {
        continue;
      }

      await this.applyRelationshipChange(
        tx,
        worldId,
        character,
        change.delta,
        change.status,
        change.note,
      );
    }
  }

  private async applyRelationshipChange(
    tx: Tx,
    worldId: number,
    character: CharacterRow,
    delta: number | undefined,
    status: RelationshipStatus | undefined,
    note: string | undefined,
  ): Promise<void> {
    const existing = await this.getRelationshipRow(worldId, character.id);
    const change =
      typeof delta === 'number' && Number.isFinite(delta)
        ? clamp(Math.round(delta), -20, 20)
        : 0;
    const level = clamp((existing?.level ?? 0) + change, -100, 100);
    const nextStatus = normalizeRelationshipStatus(
      status,
      existing?.status ?? statusForLevel(level),
    );
    const nextNote = note?.trim() || existing?.note || '';

    await tx
      .insert(schema.relationships)
      .values({
        worldId,
        characterId: character.id,
        level,
        status: nextStatus,
        note: nextNote,
      })
      .onConflictDoUpdate({
        target: [
          schema.relationships.worldId,
          schema.relationships.characterId,
        ],
        set: {
          level,
          status: nextStatus,
          note: nextNote,
          updatedAt: new Date(),
        },
      });

    if (existing && existing.status !== nextStatus) {
      const [world] = await tx.select({ turn: schema.worlds.turn }).from(schema.worlds).where(eq(schema.worlds.id, worldId));
      await tx.insert(schema.relationshipMilestones).values({
        worldId,
        characterId: character.id,
        turn: world?.turn ?? 0,
        previousStatus: existing.status,
        nextStatus,
        title: `${character.name} is now ${nextStatus}`,
        note: nextNote || `Your relationship with ${character.name} changed.`,
      });
      await tx.insert(schema.notifications).values({
        worldId,
        type: 'relationship',
        title: `${character.name} relationship update`,
        body: `${existing.status} → ${nextStatus}. ${nextNote || `Your relationship with ${character.name} changed.`}`,
        href: `/worlds/${worldId}/profile/${character.id}`,
      });
    }
  }

  private async getRelationshipRow(
    worldId: number,
    characterId: number,
  ): Promise<RelationshipRow | undefined> {
    const [row] = await this.db
      .select()
      .from(schema.relationships)
      .where(
        and(
          eq(schema.relationships.worldId, worldId),
          eq(schema.relationships.characterId, characterId),
        ),
      );

    return row;
  }

  private async listRelationships(worldId: number) {
    return this.db
      .select({
        id: schema.relationships.id,
        characterId: schema.relationships.characterId,
        name: schema.characters.name,
        handle: schema.characters.handle,
        role: schema.characters.role,
        level: schema.relationships.level,
        status: schema.relationships.status,
        note: schema.relationships.note,
        updatedAt: schema.relationships.updatedAt,
      })
      .from(schema.relationships)
      .innerJoin(
        schema.characters,
        eq(schema.relationships.characterId, schema.characters.id),
      )
      .where(eq(schema.relationships.worldId, worldId))
      .orderBy(schema.characters.id);
  }

  private async listRelationshipMilestones(worldId: number) {
    return this.db
      .select({
        id: schema.relationshipMilestones.id,
        characterId: schema.relationshipMilestones.characterId,
        characterName: schema.characters.name,
        turn: schema.relationshipMilestones.turn,
        previousStatus: schema.relationshipMilestones.previousStatus,
        nextStatus: schema.relationshipMilestones.nextStatus,
        title: schema.relationshipMilestones.title,
        note: schema.relationshipMilestones.note,
        createdAt: schema.relationshipMilestones.createdAt,
      })
      .from(schema.relationshipMilestones)
      .innerJoin(schema.characters, eq(schema.relationshipMilestones.characterId, schema.characters.id))
      .where(eq(schema.relationshipMilestones.worldId, worldId))
      .orderBy(desc(schema.relationshipMilestones.id))
      .limit(30);
  }

  private async countUnreadNotifications(worldId: number) {
    const rows = await this.db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.worldId, worldId), eq(schema.notifications.read, false)));
    return rows.length;
  }

  private async relationshipContext(
    worldId: number,
  ): Promise<RelationshipContext[]> {
    const rows = await this.listRelationships(worldId);
    return rows.map((row) => ({
      character: row.name,
      handle: row.handle,
      level: row.level,
      status: row.status,
      note: row.note,
    }));
  }

  private async getCharacters(worldId: number): Promise<CharacterRow[]> {
    return this.db
      .select()
      .from(schema.characters)
      .where(eq(schema.characters.worldId, worldId))
      .orderBy(schema.characters.id);
  }

  private async getCharacter(
    worldId: number,
    characterId: number,
  ): Promise<CharacterRow> {
    const [character] = await this.db
      .select()
      .from(schema.characters)
      .where(
        and(
          eq(schema.characters.worldId, worldId),
          eq(schema.characters.id, characterId),
        ),
      );

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    return character;
  }

  private async getRecentPosts(
    worldId: number,
    limit: number,
  ): Promise<FeedPost[]> {
    const posts = await this.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.worldId, worldId))
      .orderBy(desc(schema.posts.id))
      .limit(clamp(limit, 1, 100));
    if (!posts.length) return [];

    const interactions = await this.db
      .select()
      .from(schema.postInteractions)
      .where(eq(schema.postInteractions.worldId, worldId));
    return posts.map((post) => {
      const current = interactions.filter((item) => item.postId === post.id);
      return {
        ...post,
        repostCount: current.filter((item) => item.type === 'repost').length,
        quoteCount: current.filter((item) => item.type === 'quote').length,
        liked: current.some((item) => item.type === 'like'),
        reposted: current.some((item) => item.type === 'repost'),
      };
    });
  }

  private async getPostRow(worldId: number, postId: number): Promise<PostRow> {
    const [post] = await this.db
      .select()
      .from(schema.posts)
      .where(
        and(eq(schema.posts.worldId, worldId), eq(schema.posts.id, postId)),
      );

    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    return post;
  }

  private resolveActor(
    author: string | undefined,
    actors: CharacterRow[],
  ): CharacterRow | undefined {
    const raw = (author ?? '').trim().toLowerCase();

    if (!raw) {
      return undefined;
    }

    const withoutAt = raw.replace(/^@/, '');
    const withAt = `@${withoutAt}`;
    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawNorm = normalize(withoutAt);

    const exact = actors.find((actor) => {
      const handle = actor.handle.toLowerCase();
      const handleNorm = normalize(actor.handle);
      const nameNorm = normalize(actor.name);

      return (
        handle === raw ||
        handle === withAt ||
        handleNorm === rawNorm ||
        nameNorm === rawNorm
      );
    });

    if (exact) {
      return exact;
    }

    if (rawNorm.length < 6) {
      return undefined;
    }

    return actors.find((actor) => {
      const handleNorm = normalize(actor.handle);
      const nameNorm = normalize(actor.name);
      const closeToHandle =
        handleNorm.length >= 6 &&
        Math.abs(rawNorm.length - handleNorm.length) <= 2 &&
        editDistance(rawNorm, handleNorm) <= 2;
      const closeToName =
        nameNorm.length >= 6 &&
        Math.abs(rawNorm.length - nameNorm.length) <= 2 &&
        editDistance(rawNorm, nameNorm) <= 2;

      return closeToHandle || closeToName;
    });
  }

  private toActorContext(character: CharacterRow): ActorContext {
    return {
      id: character.id,
      name: character.name,
      handle: character.handle,
      kind: character.kind,
      role: character.role,
      persona: character.persona,
    };
  }

  private toActorContexts(characters: CharacterRow[]): ActorContext[] {
    return characters.map((character) => this.toActorContext(character));
  }

  private toRecentPost(post: PostRow): RecentPostContext {
    return {
      authorName: post.authorName,
      authorHandle: post.authorHandle,
      content: post.content,
      kind: post.kind,
    };
  }

  private publicCharacter(character: CharacterRow) {
    const normalizedGender =
      character.gender === 'woman' || character.gender === 'girl' ? 'female'
        : character.gender === 'man' || character.gender === 'boy' ? 'male'
        : character.gender === 'non-binary' ? 'nonbinary'
        : character.gender;
    return {
      id: character.id,
      name: character.name,
      handle: character.handle,
      avatarUrl: character.avatarUrl,
      gender: normalizedGender,
      kind: character.kind,
      role: character.role,
      bio: character.bio,
      additionalDescription: character.additionalDescription,
      followerCount: character.followerCount,
      personality: character.persona.personality,
      publicPersona: character.persona.publicPersona,
      voice: character.persona.voice,
      isPlayer: character.isPlayer,
    };
  }

  private getScenario(key: string): ScenarioTemplate {
    const scenario = findScenario(key);

    if (!scenario) {
      throw new BadRequestException(`Unknown scenario "${key}"`);
    }

    return scenario;
  }

  private async ensureWorld(id: number) {
    const [world] = await this.db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.id, id));

    if (!world) {
      throw new NotFoundException(`World ${id} not found`);
    }

    return world;
  }

  private clip(value: string | undefined, max: number): string {
    return (value ?? '').trim().slice(0, max);
  }
}
