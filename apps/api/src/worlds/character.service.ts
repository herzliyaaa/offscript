import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { CreateCharacterDto, UpdateCharacterDto } from './dto/world.dto.js';

@Injectable()
export class CharacterService {
  constructor(private readonly world: WorldService) {}

  updateCharacter(worldId: number, characterId: number, dto: UpdateCharacterDto) {
    return this.world.updateCharacter(worldId, characterId, dto);
  }

  createCharacter(worldId: number, dto: CreateCharacterDto) {
    return this.world.createCharacter(worldId, dto);
  }
}
