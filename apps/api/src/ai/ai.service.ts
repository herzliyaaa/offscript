import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatRequest, Message, Ollama, Options } from 'ollama';
import { OLLAMA } from './ai.provider.js';

export type AiThinking = boolean | 'high' | 'medium' | 'low';

export interface AiChatOptions {
  model?: string;
  system?: string;
  temperature?: number;
  numCtx?: number;
  maxTokens?: number;
  think?: AiThinking;
  keepAlive?: string | number;
  format?: string | object;
}

export interface AiHealth {
  status: 'ok' | 'degraded';
  model: string;
  modelLoaded: boolean;
  models: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: string;
  private readonly fastModel: string;
  private readonly embedModel: string;
  private readonly temperature: number;
  private readonly numCtx: number;
  private readonly think: AiThinking;
  private readonly keepAlive: string | number;

  constructor(
    @Inject(OLLAMA) private readonly ollama: Ollama,
    config: ConfigService,
  ) {
    this.model = config.get<string>('ai.model', 'qwen3.5:4b');
    this.fastModel = config.get<string>('ai.fastModel', 'qwen3:1.7b');
    this.embedModel = config.get<string>('ai.embedModel', 'nomic-embed-text');
    this.temperature = config.get<number>('ai.temperature', 0.7);
    this.numCtx = config.get<number>('ai.numCtx', 8192);
    this.think = config.get<AiThinking>('ai.think', false);
    this.keepAlive = config.get<string>('ai.keepAlive', '10m');
  }

  get modelName(): string {
    return this.model;
  }

  get fastModelName(): string {
    return this.fastModel;
  }

  async chat(
    messages: Message[],
    options: AiChatOptions = {},
  ): Promise<string> {
    const request: ChatRequest & { stream: true } = {
      model: options.model ?? this.model,
      messages: options.system
        ? [{ role: 'system', content: options.system }, ...messages]
        : messages,
      stream: true,
      think: options.think ?? this.think,
      keep_alive: options.keepAlive ?? this.keepAlive,
      options: this.buildOptions(options),
    };

    if (options.format) {
      request.format = options.format;
    }

    try {
      const startedAt = Date.now();
      const stream = await this.ollama.chat(request);
      let content = '';

      for await (const part of stream) {
        content += part.message?.content ?? '';
      }

      this.logger.log(
        `Ollama chat completed in ${Date.now() - startedAt}ms (model: ${request.model})`,
      );

      return this.cleanContent(content);
    } catch (error) {
      this.logger.error(
        `Ollama chat failed for model "${this.model}"`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        `AI model "${this.model}" is unavailable. Is Ollama running?`,
      );
    }
  }

  async generate(prompt: string, options: AiChatOptions = {}): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async generateObject<T>(
    prompt: string,
    schema: Record<string, unknown>,
    options: AiChatOptions = {},
  ): Promise<T> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
    const chatOptions: AiChatOptions = {
      ...options,
      format: schema,
      think: options.think ?? false,
    };

    const first = await this.chat(messages, chatOptions);
    const parsed = this.tryParseJson<T>(first);

    if (parsed !== undefined) {
      return parsed;
    }

    this.logger.warn(
      `Model "${this.model}" returned invalid JSON; retrying once`,
    );

    const repaired = await this.chat(
      [
        ...messages,
        { role: 'assistant', content: first },
        {
          role: 'user',
          content:
            'Your previous response was not valid JSON. Return ONLY a valid JSON object that matches the schema. No markdown, no commentary.',
        },
      ],
      chatOptions,
    );
    const retryParsed = this.tryParseJson<T>(repaired);

    if (retryParsed !== undefined) {
      return retryParsed;
    }

    this.logger.error(
      `Model "${this.model}" returned invalid JSON: ${repaired}`,
    );
    throw new ServiceUnavailableException(
      'AI returned an invalid JSON response',
    );
  }

  async embed(input: string | string[]): Promise<number[][]> {
    try {
      const response = await this.ollama.embed({
        model: this.embedModel,
        input,
        keep_alive: this.keepAlive,
      });
      return response.embeddings;
    } catch (error) {
      this.logger.error(
        `Ollama embed failed for model "${this.embedModel}"`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        `Embedding model "${this.embedModel}" is unavailable. Run "ollama pull ${this.embedModel}".`,
      );
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((model) => model.name);
    } catch (error) {
      this.logger.error(
        'Failed to list Ollama models',
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException('Ollama is unavailable');
    }
  }

  async health(): Promise<AiHealth> {
    const models = await this.listModels();
    const modelLoaded = models.some(
      (name) => name === this.model || name === `${this.model}:latest`,
    );

    return {
      status: modelLoaded ? 'ok' : 'degraded',
      model: this.model,
      modelLoaded,
      models,
    };
  }

  private tryParseJson<T>(content: string): T | undefined {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1)) as T;
        } catch {
          return undefined;
        }
      }

      return undefined;
    }
  }

  private cleanContent(content: string): string {
    const marker = '</think>';
    const end = content.lastIndexOf(marker);

    if (end !== -1) {
      return content.slice(end + marker.length).trim();
    }

    return content.trim();
  }

  private buildOptions(options: AiChatOptions): Partial<Options> {
    const result: Partial<Options> = {
      temperature: options.temperature ?? this.temperature,
      num_ctx: options.numCtx ?? this.numCtx,
    };

    if (options.maxTokens !== undefined) {
      result.num_predict = options.maxTokens;
    }

    return result;
  }
}
