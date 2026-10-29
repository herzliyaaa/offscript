import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { DatabaseModule } from '../db/database.module.js';
import { WorldsController } from './worlds.controller.js';
import { WorldsService } from './worlds.service.js';

@Module({
  imports: [DatabaseModule, AiModule],
  controllers: [WorldsController],
  providers: [WorldsService],
  exports: [WorldsService],
})
export class WorldsModule {}
