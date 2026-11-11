#!/usr/bin/env node
/**
 * Inserts any stan accounts that are missing from existing worlds.
 *
 * New worlds get every stan seed automatically at creation, but worlds
 * created before a seed was added need a one-time backfill so that every
 * post can collect 10+ replies from distinct accounts.
 *
 * Usage:
 *   pnpm build                                # dist/ must be current
 *   node scripts/backfill-stans.mjs           # all worlds
 *   node scripts/backfill-stans.mjs --world 2
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { Client } from 'pg';
import { buildStanAccounts } from '../dist/worlds/stan.accounts.js';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: join(here, '../../../.env') });

const args = process.argv.slice(2);
const worldFlagIndex = args.indexOf('--world');
const worldFilter =
  worldFlagIndex !== -1 ? Number(args[worldFlagIndex + 1]) : undefined;

if (worldFlagIndex !== -1 && (!Number.isInteger(worldFilter) || worldFilter < 1)) {
  console.error('Invalid --world — use a numeric world id, or omit it for all worlds.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const worlds = await client.query(
    'select id, player_name from worlds order by id',
  );
  const targets = worlds.rows.filter((row) =>
    worldFilter === undefined ? true : row.id === worldFilter,
  );

  if (!targets.length) {
    console.log('No matching worlds — nothing to do.');
  }

  for (const world of targets) {
    const characters = await client.query(
      'select name, handle, kind, stats from characters where world_id = $1',
      [world.id],
    );
    // buildStanAccounts mutates the set it receives (uniqueHandle registers
    // every seed handle), so snapshot the existing handles first.
    const existingHandles = new Set(characters.rows.map((row) => row.handle));
    const usedHandles = new Set(existingHandles);
    // Seed names are deterministic, so presence is detected by name: a
    // regenerated seed whose handle already exists gets suffixed by
    // uniqueHandle, which would defeat a handle-based check.
    const existingNames = new Set(characters.rows.map((row) => row.name));
    const existingStanStats =
      characters.rows.find((row) => row.kind === 'stan')?.stats ?? {};

    const seeds = buildStanAccounts(world.player_name, usedHandles);
    const missing = seeds.filter((seed) => !existingNames.has(seed.name));

    if (!missing.length) {
      console.log(`world ${world.id} (${world.player_name}): all stans present.`);
      continue;
    }

    const rowValues = missing.flatMap((seed) => [
      world.id,
      seed.name,
      seed.handle,
      seed.role,
      seed.bio,
      JSON.stringify(seed.persona),
      JSON.stringify(existingStanStats),
    ]);
    const tuples = missing
      .map(
        (_, index) =>
          `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, 'stan', ` +
          `$${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, ` +
          `$${index * 7 + 7}, '[]'::jsonb, '[]'::jsonb, 'curious', false)`,
      )
      .join(', ');

    await client.query(
      `insert into characters
        (world_id, name, handle, kind, role, bio, persona, stats, memory, goals, mood, is_player)
       values ${tuples}`,
      rowValues,
    );

    console.log(
      `world ${world.id} (${world.player_name}): added ${missing.length} stans ` +
        `(${missing.map((seed) => seed.handle).join(', ')})`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
