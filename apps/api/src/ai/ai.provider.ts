import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';

export const OLLAMA = Symbol('OLLAMA');

export const ollamaProvider = {
  provide: OLLAMA,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new Ollama({
      host: config.get<string>('ai.host', 'http://127.0.0.1:11434'),
    }),
};
