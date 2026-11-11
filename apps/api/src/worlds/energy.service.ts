import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql, type ExtractTablesWithRelations } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { WorldEnergy } from '@offscript/types';
import { DATABASE } from '../db/database.provider.js';
import * as schema from '../db/schema.js';

type Db = NodePgDatabase<typeof schema>;
type Tx = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type Executor = Db | Tx;

/** Minimal world columns the energy system reads and writes. */
type EnergyRow = {
  energyBonusUnits: number;
  energyUsedUnits: number;
  energyDate: string;
};

/**
 * Energy is stored as integer "fifths" (units) so fractional costs stay exact:
 * 1 energy = 5 units and a direct message costs 1 unit (0.2 energy).
 */
export const UNITS_PER_ENERGY = 5;
/** Daily allowance: 10 energy. */
export const DAILY_ENERGY_UNITS = 10 * UNITS_PER_ENERGY;
/** Bonus energy granted to new worlds: 10 energy. */
export const INITIAL_BONUS_UNITS = 10 * UNITS_PER_ENERGY;

export const ENERGY_COST_UNITS = {
  post: 5,
  reply: 5,
  act: 5,
  event: 5,
  message: 1,
} as const;

export type EnergyAction = keyof typeof ENERGY_COST_UNITS;

const PUBLIC_COSTS = {
  post: ENERGY_COST_UNITS.post / UNITS_PER_ENERGY,
  reply: ENERGY_COST_UNITS.reply / UNITS_PER_ENERGY,
  act: ENERGY_COST_UNITS.act / UNITS_PER_ENERGY,
  event: ENERGY_COST_UNITS.event / UNITS_PER_ENERGY,
  message: ENERGY_COST_UNITS.message / UNITS_PER_ENERGY,
} as const;

export interface EnergySnapshot {
  availableUnits: number;
  dailyRemainingUnits: number;
  bonusUnits: number;
}

export class InsufficientEnergyException extends HttpException {
  constructor(snapshot: EnergySnapshot) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        code: 'INSUFFICIENT_ENERGY',
        message:
          'Not enough energy for that. Your daily energy resets at midnight UTC, and bonus energy can be added to keep playing.',
        energy: {
          available: snapshot.availableUnits / UNITS_PER_ENERGY,
          dailyRemaining: snapshot.dailyRemainingUnits / UNITS_PER_ENERGY,
          bonus: snapshot.bonusUnits / UNITS_PER_ENERGY,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextUtcMidnight(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
}

@Injectable()
export class EnergyService {
  constructor(
    @Inject(DATABASE)
    private readonly db: Db,
    private readonly config: ConfigService,
  ) {}

  /** Public energy payload attached to world responses. */
  toPublicEnergy(row: EnergyRow): WorldEnergy {
    const { usedUnits, bonusUnits } = this.resolveRow(row);
    const dailyRemainingUnits = Math.max(0, DAILY_ENERGY_UNITS - usedUnits);

    return {
      available:
        (dailyRemainingUnits + bonusUnits) / UNITS_PER_ENERGY,
      dailyLimit: DAILY_ENERGY_UNITS / UNITS_PER_ENERGY,
      dailyRemaining: dailyRemainingUnits / UNITS_PER_ENERGY,
      bonus: bonusUnits / UNITS_PER_ENERGY,
      costs: PUBLIC_COSTS,
      resetsAt: nextUtcMidnight().toISOString(),
    };
  }

  /**
   * Cheap pre-flight check: throws before any expensive AI call when the
   * action cannot be paid for. Reads without locking; `spend` re-checks
   * authoritatively before writing.
   */
  async assert(worldId: number, action: EnergyAction): Promise<void> {
    const snapshot = await this.snapshot(worldId);

    if (snapshot.availableUnits < ENERGY_COST_UNITS[action]) {
      throw new InsufficientEnergyException(snapshot);
    }
  }

  /**
   * Charges an action. When `tx` is provided the charge joins the caller's
   * transaction (a failed write refunds the energy); otherwise it runs in its
   * own transaction. Locks the world row so concurrent actions cannot
   * overspend, and rolls the daily allowance over lazily.
   */
  async spend(
    worldId: number,
    action: EnergyAction,
    tx?: Tx,
  ): Promise<WorldEnergy> {
    const cost = ENERGY_COST_UNITS[action];
    const today = utcToday();

    const charge = async (runner: Executor): Promise<WorldEnergy> => {
      const [row] = await runner
        .select({
          energyBonusUnits: schema.worlds.energyBonusUnits,
          energyUsedUnits: schema.worlds.energyUsedUnits,
          energyDate: schema.worlds.energyDate,
        })
        .from(schema.worlds)
        .where(eq(schema.worlds.id, worldId))
        .for('update');

      if (!row) {
        throw new NotFoundException(`World ${worldId} not found`);
      }

      // Lazy daily reset: usage from any previous day no longer counts.
      const usedUnits = row.energyDate === today ? row.energyUsedUnits : 0;
      const dailyRemainingUnits = Math.max(0, DAILY_ENERGY_UNITS - usedUnits);
      const availableUnits = dailyRemainingUnits + row.energyBonusUnits;

      if (availableUnits < cost) {
        throw new InsufficientEnergyException({
          availableUnits,
          dailyRemainingUnits,
          bonusUnits: row.energyBonusUnits,
        });
      }

      // The daily allowance is consumed first; any overflow dips into bonus.
      const appliedToDaily = Math.min(dailyRemainingUnits, cost);
      const nextUsedUnits = usedUnits + appliedToDaily;
      const nextBonusUnits = row.energyBonusUnits - (cost - appliedToDaily);

      await runner
        .update(schema.worlds)
        .set({
          energyUsedUnits: nextUsedUnits,
          energyBonusUnits: nextBonusUnits,
          energyDate: today,
        })
        .where(eq(schema.worlds.id, worldId));

      return this.toPublicEnergy({
        energyUsedUnits: nextUsedUnits,
        energyBonusUnits: nextBonusUnits,
        energyDate: today,
      });
    };

    return tx ? charge(tx) : this.db.transaction(charge);
  }

  /** Current energy without writing anything. */
  async snapshot(worldId: number): Promise<EnergySnapshot> {
    const [row] = await this.db
      .select({
        energyBonusUnits: schema.worlds.energyBonusUnits,
        energyUsedUnits: schema.worlds.energyUsedUnits,
        energyDate: schema.worlds.energyDate,
      })
      .from(schema.worlds)
      .where(eq(schema.worlds.id, worldId));

    if (!row) {
      throw new NotFoundException(`World ${worldId} not found`);
    }

    const { usedUnits, bonusUnits } = this.resolveRow(row);
    const dailyRemainingUnits = Math.max(0, DAILY_ENERGY_UNITS - usedUnits);

    return {
      availableUnits: dailyRemainingUnits + bonusUnits,
      dailyRemainingUnits,
      bonusUnits,
    };
  }

  /** Grants bonus energy (whole energy units). */
  async addBonus(worldId: number, amount: number): Promise<WorldEnergy> {
    const units = Math.round(amount) * UNITS_PER_ENERGY;

    const [row] = await this.db
      .update(schema.worlds)
      .set({
        energyBonusUnits: sql`${schema.worlds.energyBonusUnits} + ${units}`,
      })
      .where(eq(schema.worlds.id, worldId))
      .returning({
        energyBonusUnits: schema.worlds.energyBonusUnits,
        energyUsedUnits: schema.worlds.energyUsedUnits,
        energyDate: schema.worlds.energyDate,
      });

    if (!row) {
      throw new NotFoundException(`World ${worldId} not found`);
    }

    return this.toPublicEnergy(row);
  }

  /**
   * Guards admin-only energy grants. When `ENERGY_ADMIN_KEY` is unset the
   * endpoint stays open for local development, mirroring moderation's
   * `assertAdmin` but permissive by default.
   */
  assertAdmin(adminKey: string | undefined): void {
    const expected = this.config.get<string>('energyAdminKey') ?? '';

    if (expected && adminKey !== expected) {
      throw new UnauthorizedException('Invalid energy admin key.');
    }
  }

  private resolveRow(row: EnergyRow): {
    usedUnits: number;
    bonusUnits: number;
  } {
    const isNewDay = row.energyDate !== utcToday();

    return {
      usedUnits: isNewDay ? 0 : row.energyUsedUnits,
      bonusUnits: row.energyBonusUnits,
    };
  }
}
