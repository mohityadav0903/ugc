import { Hono } from 'hono';
import { ApiRoutes } from '@ugc/types';
import type { AppContext } from './context.js';
import { createChatRoutes } from './routes/chat.js';
import { createThreadRoutes } from './routes/threads.js';

export function createApp(context: AppContext): Hono {
  const app = new Hono();

  app.get(ApiRoutes.health, (c) =>
    c.json({
      ok: true,
      service: 'ugc-server',
    }),
  );

  app.route(ApiRoutes.threads, createThreadRoutes(context));
  app.route('/', createChatRoutes(context));

  return app;
}
