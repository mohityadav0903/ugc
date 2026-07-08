FROM oven/bun:1.2.4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1.2.4 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN bun run build

FROM oven/bun:1.2.4 AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["bun", "run", "start"]
