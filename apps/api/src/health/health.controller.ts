import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { DATABASE } from '../db/database.provider.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.db.execute(sql`select 1`);
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service is not ready');
    }
  }
}
