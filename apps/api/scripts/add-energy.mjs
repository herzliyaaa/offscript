#!/usr/bin/env node
/**
 * Grants bonus energy to one world or every world.
 *
 * Usage:
 *   node scripts/add-energy.mjs                       # +10 energy to every world
 *   node scripts/add-energy.mjs --world 3             # +10 energy to world 3
 *   node scripts/add-energy.mjs --world all --amount 25
 *   node scripts/add-energy.mjs --world 3 --key secret   # when ENERGY_ADMIN_KEY is set on the API
 *
 * Environment:
 *   API_URL           Base URL of the API (default http://localhost:3001/api)
 *   ENERGY_ADMIN_KEY  Sent as x-energy-admin-key if --key is not given
 */

const args = process.argv.slice(2);

function flag(name) {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : undefined;
}

const amount = Number(flag("amount") ?? 10);
const worldArg = flag("world") ?? "all";
const key = flag("key") ?? process.env.ENERGY_ADMIN_KEY;
const baseUrl = (process.env.API_URL ?? "http://localhost:3001/api").replace(/\/+$/, "");

if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
  console.error(`Invalid --amount "${amount}" — use a whole number between 1 and 1000.`);
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  ...(key ? { "x-energy-admin-key": key } : {}),
};

async function postBonus(worldId) {
  const res = await fetch(`${baseUrl}/worlds/${worldId}/energy/bonus`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error(`world ${worldId}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function listWorldIds() {
  const res = await fetch(`${baseUrl}/worlds`);
  if (!res.ok) {
    throw new Error(`Failed to list worlds: ${res.status} ${await res.text()}`);
  }
  const worlds = await res.json();
  if (!Array.isArray(worlds) || worlds.length === 0) {
    throw new Error("No worlds found.");
  }
  return worlds.map((world) => world.id);
}

try {
  let worldIds;
  if (worldArg === "all") {
    worldIds = await listWorldIds();
  } else {
    const worldId = Number(worldArg);
    if (!Number.isInteger(worldId) || worldId < 1) {
      throw new Error(`Invalid --world "${worldArg}" — use a numeric world id or "all".`);
    }
    worldIds = [worldId];
  }

  const target = worldIds.length === 1 ? `world ${worldIds[0]}` : `${worldIds.length} worlds`;
  console.log(`Adding ${amount} bonus energy to ${target} at ${baseUrl}…`);

  for (const worldId of worldIds) {
    const energy = await postBonus(worldId);
    console.log(
      `  world ${worldId}: ${energy.available} available ` +
        `(${energy.bonus} bonus, ${energy.dailyRemaining}/${energy.dailyLimit} daily left)`,
    );
  }
  console.log("Done.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
