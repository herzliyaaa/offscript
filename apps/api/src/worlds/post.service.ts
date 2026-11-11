import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';
import type { CreatePostDto, PostInteractionDto } from './dto/world.dto.js';

@Injectable()
export class PostService {
  constructor(private readonly world: WorldService) {}

  feed(worldId: number, limit?: number) { return this.world.feed(worldId, limit); }
  getPost(worldId: number, postId: number) { return this.world.getPost(worldId, postId); }
  interactWithPost(worldId: number, postId: number, dto: PostInteractionDto) { return this.world.interactWithPost(worldId, postId, dto.type); }
  createPost(worldId: number, dto: CreatePostDto) { return this.world.createPost(worldId, dto); }
}
