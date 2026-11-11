import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { SendDmDto } from './dto/world.dto.js';

@Injectable()
export class MessageService {
  constructor(private readonly world: WorldService) {}

  listDms(worldId: number, characterId: number, limit?: number) { return this.world.listDms(worldId, characterId, limit); }
  listConversations(worldId: number) { return this.world.listConversations(worldId); }
  sendDm(worldId: number, characterId: number, dto: SendDmDto) { return this.world.sendDm(worldId, characterId, dto); }
}
