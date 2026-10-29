import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service.js';
import { ChatDto, GenerateDto } from './dto/ai.dto.js';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Ollama and the configured model' })
  health() {
    return this.ai.health();
  }

  @Get('models')
  @ApiOperation({ summary: 'List locally available Ollama models' })
  models() {
    return this.ai.listModels();
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat completion request' })
  async chat(@Body() dto: ChatDto) {
    const content = await this.ai.chat(dto.messages, {
      system: dto.system,
      temperature: dto.temperature,
      think: dto.think,
    });

    return { model: this.ai.modelName, content };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate text from a single prompt' })
  async generate(@Body() dto: GenerateDto) {
    const content = await this.ai.generate(dto.prompt, {
      system: dto.system,
      temperature: dto.temperature,
      think: dto.think,
    });

    return { model: this.ai.modelName, content };
  }
}
