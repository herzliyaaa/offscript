import type { ConfigService } from '@nestjs/config';
import type { Ollama } from 'ollama';
import { AiService } from './ai.service.js';

function streamed(content: string) {
  return (async function* () {
    yield { message: { role: 'assistant', content } };
  })();
}

describe('AiService', () => {
  const chat = vi.fn();
  const list = vi.fn();
  const embed = vi.fn();
  let service: AiService;

  beforeEach(() => {
    vi.clearAllMocks();

    const config = {
      get: (_key: string, defaultValue: unknown) => defaultValue,
    };

    service = new AiService(
      { chat, list, embed } as unknown as Ollama,
      config as unknown as ConfigService,
    );
  });

  it('strips inline reasoning from qwen3 output', async () => {
    chat.mockResolvedValue(
      streamed('Okay, let me think about this.\n\n</think>\n\nFinal answer'),
    );

    await expect(service.generate('Say hi')).resolves.toBe('Final answer');
  });

  it('parses structured output and disables thinking', async () => {
    chat.mockResolvedValue(streamed('{"text":"hello","mood":"happy"}'));

    const result = await service.generateObject<{
      text: string;
      mood: string;
    }>('Generate a post', { type: 'object' });

    expect(result).toEqual({ text: 'hello', mood: 'happy' });
    expect(chat).toHaveBeenCalledWith(
      expect.objectContaining({ format: { type: 'object' }, think: false }),
    );
  });

  it('returns embeddings', async () => {
    embed.mockResolvedValue({ embeddings: [[0.1, 0.2]] });

    await expect(service.embed('hello')).resolves.toEqual([[0.1, 0.2]]);
  });

  it('reports a degraded health status when the model is missing', async () => {
    list.mockResolvedValue({ models: [{ name: 'other:latest' }] });

    await expect(service.health()).resolves.toMatchObject({
      status: 'degraded',
      modelLoaded: false,
    });
  });
});
