import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from './database.provider.js';

@Injectable()
export class DatabaseShutdownService implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
