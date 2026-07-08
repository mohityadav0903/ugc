# UGC Studio

Agent-driven TikTok-style promo video generator. Chat with an AI creative director that researches your product, finds meme clips and backgrounds, and renders short vertical videos with ffmpeg.

## Stack

- **Runtime:** [Bun](https://bun.sh)
- **Web:** Next.js 15, React 19, Tailwind CSS 4
- **API:** Hono (`apps/server`)
- **Pipeline:** OpenAI tool-calling agent + KLIPY / Giphy / Pexels / Jamendo
- **Storage:** SQLite + local video files

## Monorepo layout

```
apps/
  server/     # Hono API, chat streaming, video render
  web/        # Next.js chat UI
packages/
  types/      # Shared Zod schemas and config
  db/         # SQLite persistence
  pipeline/   # Asset search, ffmpeg compose, agent tools
```

## Prerequisites

- Bun 1.2+
- ffmpeg and ffprobe on `PATH`
- API keys (see below)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy environment file and fill in keys:

```bash
cp apps/server/.env.example apps/server/.env
```

3. Seed demo audio presets (first run):

```bash
bun run seed:audio
```

4. Start dev servers (web on `:3000`, API on `:4000`):

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Chat agent and tool orchestration |
| `PEXELS_API_KEY` | Yes | Background lifestyle videos |
| `GIPHY_API_KEY` | Yes | Meme GIF / clip fallback |
| `KLIPY_API_KEY` | No | Preferred meme clips with audio ([klipy.com/developers](https://klipy.com/developers)) |
| `JAMENDO_CLIENT_ID` | No | Background music search |
| `TAVILY_API_KEY` | No | Trend research (recommended) |
| `PUBLIC_URL` | No | Base URL for rendered videos (default `http://localhost:3000`) |
| `FFMPEG_PATH` | No | ffmpeg binary (default `ffmpeg`) |

## Agent pipeline

1. `research_product` — scrape product URL
2. `research_trends` — Tavily + meme catalog for hooks and queries
3. `search_assets` — meme, background, and audio candidates with thumbnails
4. `render_ugc_video` — agent picks `layout`:
   - **`full_bleed`** — meme fills the frame (no Pexels background)
   - **`layered`** — aesthetic background + centered meme overlay

## Docker

```bash
docker compose up --build
```

Set `OPENAI_API_KEY`, `PEXELS_API_KEY`, and `GIPHY_API_KEY` in your shell or a root `.env` file before starting.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start web + server in parallel |
| `bun run typecheck` | Typecheck all packages |
| `bun run seed:audio` | Generate demo Jamendo-style audio presets |

## License

Private — all rights reserved.
