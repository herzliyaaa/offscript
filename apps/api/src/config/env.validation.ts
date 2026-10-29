import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3001),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  OLLAMA_HOST: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://127.0.0.1:11434'),

  OLLAMA_MODEL: Joi.string().default('qwen3.5:4b'),

  OLLAMA_FAST_MODEL: Joi.string().default('qwen3:1.7b'),

  OLLAMA_EMBED_MODEL: Joi.string().default('nomic-embed-text'),

  OLLAMA_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),

  OLLAMA_NUM_CTX: Joi.number().integer().min(512).default(8192),

  OLLAMA_THINK: Joi.boolean().default(false),

  OLLAMA_KEEP_ALIVE: Joi.string().default('10m'),
});
