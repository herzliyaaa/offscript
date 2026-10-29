import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

export const databaseProviders = [
  {
    provide: PG_POOL,
    useFactory: () => {
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 30_000,
      });
    },
  },
  {
    provide: DATABASE,
    inject: [PG_POOL],
    useFactory: (pool: Pool) => {
      return drizzle({
        client: pool,
        schema,
      });
    },
  },
];
