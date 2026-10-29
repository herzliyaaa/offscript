export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  ai: {
    host: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL ?? 'qwen3.5:4b',
    fastModel: process.env.OLLAMA_FAST_MODEL ?? 'qwen3:1.7b',
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
    temperature: Number(process.env.OLLAMA_TEMPERATURE ?? 0.7),
    numCtx: Number(process.env.OLLAMA_NUM_CTX ?? 8192),
    think: process.env.OLLAMA_THINK === 'true',
    keepAlive: process.env.OLLAMA_KEEP_ALIVE ?? '10m',
  },
});
