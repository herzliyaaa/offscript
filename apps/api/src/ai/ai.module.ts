import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { ollamaProvider } from './ai.provider.js';

@Module({
  controllers: [AiController],
  providers: [ollamaProvider, AiService],
  exports: [AiService],
})
export class AiModule {}
