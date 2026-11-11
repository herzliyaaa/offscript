import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { CreateWorldDto } from './dto/world.dto.js';

@Injectable()
export class SimulationService {
  constructor(private readonly world: WorldService) {}

  create(dto: CreateWorldDto) { return this.world.create(dto); }
  list(userId?: number) { return this.world.list(userId); }
  get(worldId: number) { return this.world.get(worldId); }
  listCelebrityPresets() { return this.world.listCelebrityPresets(); }
}
