import { Injectable } from '@nestjs/common';
import { WorldService } from './world.service.js';

/** Compatibility facade for existing controllers and consumers. */
@Injectable()
export class WorldsService extends WorldService {}
