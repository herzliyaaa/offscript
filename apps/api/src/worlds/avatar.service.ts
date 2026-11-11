import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { AvatarUpload } from './world.types.js';

@Injectable()
export class AvatarService {
  constructor(private readonly world: WorldService) {}

  saveAvatar(file: AvatarUpload | undefined, publicOrigin: string) {
    return this.world.saveAvatar(file, publicOrigin);
  }
}
