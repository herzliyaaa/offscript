import { Module } from '@nestjs/common';
import { databaseProviders } from './database.provider.js';
import { DatabaseShutdownService } from './database-shutdown.service.js';

@Module({
  providers: [...databaseProviders, DatabaseShutdownService],
  exports: databaseProviders,
})
export class DatabaseModule {}
