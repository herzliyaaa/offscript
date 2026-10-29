
FROM node:22-bookworm-slim

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --no-frozen-lockfile

EXPOSE 3001

CMD ["pnpm", "--filter", "./apps/api", "start:dev"]
