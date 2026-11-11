import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { GenerateEventDto, WorldActionDto } from './dto/world.dto.js';

@Injectable()
export class EventService {
  constructor(private readonly world: WorldService) {}

  generateEvent(worldId: number, dto: GenerateEventDto) { return this.world.generateEvent(worldId, dto); }
  generateEventScenarios(worldId: number) { return this.world.generateEventScenarios(worldId); }
  listEvents(worldId: number, limit?: number) { return this.world.listEvents(worldId, limit); }
  act(worldId: number, dto: WorldActionDto) {
    return this.world.act(worldId, dto.action, {
      title: dto.eventTitle,
      description: dto.eventDescription,
      sourceName: dto.eventSourceName,
      sourceHandle: dto.eventSourceHandle,
    });
  }
}
