FROM oven/bun:1.2.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY packages/pipeline/package.json ./packages/pipeline/
COPY apps/server/package.json ./apps/server/

RUN bun install --frozen-lockfile || bun install

COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/db ./packages/db
COPY packages/pipeline ./packages/pipeline
COPY apps/server ./apps/server
COPY data/audio ./data/audio

WORKDIR /app/apps/server
EXPOSE 4000
CMD ["bun", "src/index.ts"]
