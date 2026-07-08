import { join } from 'node:path';
import { cors } from 'hono/cors';
import { PublicPaths, VideoSpec } from '@ugc/types';
import { createApp } from './app';
import { bootstrapRuntime } from './bootstrap';
import { loadResolvedServerConfig } from './config';
import { createAppContext } from './context';

const config = loadResolvedServerConfig(process.env);
await bootstrapRuntime(config);
const context = createAppContext(config);

const app = createApp(context);

app.get(`${PublicPaths.videos}/:videoId`, async (c) => {
  const videoId = c.req.param('videoId');
  const filename = videoId.endsWith(`.${VideoSpec.extension}`)
    ? videoId
    : `${videoId}.${VideoSpec.extension}`;
  const file = Bun.file(join(context.config.videosDir, filename));
  if (!(await file.exists())) return c.notFound();
  return new Response(file, {
    headers: { 'Content-Type': 'video/mp4' },
  });
});

app.use(
  '*',
  cors({
    origin: context.config.publicUrl,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
);

const server = Bun.serve({
  port: context.config.serverPort,
  fetch: app.fetch,
  // Video generation can run 30s+ with no stream chunks during tool execute.
  idleTimeout: 255,
});

console.log(`ugc-server listening on http://localhost:${server.port}`);
