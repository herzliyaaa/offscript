import type { WorldEnergy } from "./types";

/**
 * Display-side energy constants. Mirrors the server's cost table so hints and
 * affordance checks work even before a world payload carries energy data.
 * 1 energy = 1 post / reply / act / event; 1 energy = 5 DMs (0.2 each).
 * Rerolling a scenario is free.
 */
export const ENERGY_COSTS = {
  post: 1,
  reply: 1,
  act: 1,
  event: 1,
  message: 0.2,
} as const;

export type EnergyAction = keyof typeof ENERGY_COSTS;

/** Formats an energy amount like "10", "9.4", or "0.2". */
export function formatEnergy(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** The cost of an action, preferring the server-reported costs. */
export function energyCost(
  energy: WorldEnergy | null | undefined,
  action: EnergyAction,
): number {
  return energy?.costs?.[action] ?? ENERGY_COSTS[action];
}

/** Whether the player can pay for an action right now. Unknown energy never blocks. */
export function canAfford(
  energy: WorldEnergy | null | undefined,
  action: EnergyAction,
): boolean {
  if (!energy) return true;
  return energy.available + 1e-9 >= energyCost(energy, action);
}

/** Short cost hint, e.g. "1 energy" or "0.2 energy". */
export function energyCostHint(
  energy: WorldEnergy | null | undefined,
  action: EnergyAction,
): string {
  return `${formatEnergy(energyCost(energy, action))} energy`;
}
