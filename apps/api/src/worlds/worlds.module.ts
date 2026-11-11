import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { DatabaseModule } from '../db/database.module.js';
import { WorldsController } from './worlds.controller.js';
import { WorldsService } from './worlds.service.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { WorldService } from './world.service.js';
import { CharacterService } from './character.service.js';
import { PostService } from './post.service.js';
import { MessageService } from './message.service.js';
import { EventService } from './event.service.js';
import { SimulationService } from './simulation.service.js';
import { AvatarService } from './avatar.service.js';

@Module({
  imports: [DatabaseModule, AiModule, ModerationModule],
  controllers: [WorldsController],
  providers: [
    WorldService,
    CharacterService,
    PostService,
    MessageService,
    EventService,
    SimulationService,
    AvatarService,
    WorldsService,
  ],
  exports: [
    WorldService,
    CharacterService,
    PostService,
    MessageService,
    EventService,
    SimulationService,
    AvatarService,
    WorldsService,
  ],
})
export class WorldsModule {}
