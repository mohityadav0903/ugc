import { Hono } from 'hono';
import { createThreadRequestSchema, DefaultThreadTitle } from '@ugc/types';
import type { AppContext } from '../context.js';
import { deriveThreadTitle, listThreadMessages, toThreadSummary } from '../mappers.js';

export function createThreadRoutes(context: AppContext): Hono {
  const router = new Hono();

  router.get('/', async (c) => {
    const threads = await context.db.listThreads();
    return c.json({ threads: threads.map(toThreadSummary) });
  });

  router.post('/', async (c) => {
    const parsed = createThreadRequestSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const body = parsed.data;
    const thread = await context.db.createThread({ title: body.title });
    return c.json({ thread: toThreadSummary(thread) }, 201);
  });

  router.get('/:id', async (c) => {
    const thread = await context.db.getThread(c.req.param('id'));
    if (!thread) return c.json({ error: 'Thread not found' }, 404);
    return c.json({ thread: toThreadSummary(thread) });
  });

  router.get('/:id/messages', async (c) => {
    const threadId = c.req.param('id');
    const thread = await context.db.getThread(threadId);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);
    const [messages, uiMessages] = await Promise.all([
      listThreadMessages(context.db, threadId),
      context.db.getThreadUiMessages(threadId),
    ]);
    return c.json({ messages, uiMessages: uiMessages ?? undefined });
  });

  router.delete('/:id', async (c) => {
    const threadId = c.req.param('id');
    const thread = await context.db.getThread(threadId);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);
    await context.db.deleteThread(threadId);
    return c.json({ ok: true });
  });

  router.patch('/:id/title', async (c) => {
    const threadId = c.req.param('id');
    const body = await c.req.json<{ title?: string }>();
    if (!body.title?.trim()) return c.json({ error: 'Title is required' }, 400);
    const thread = await context.db.getThread(threadId);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);
    const updated = await context.db.updateThreadTitle(threadId, body.title.trim());
    return c.json({ thread: toThreadSummary(updated) });
  });

  return router;
}

export async function maybeSetThreadTitleFromFirstMessage(
  context: AppContext,
  threadId: string,
  content: string,
): Promise<void> {
  const thread = await context.db.getThread(threadId);
  if (!thread || thread.title !== DefaultThreadTitle) return;
  await context.db.updateThreadTitle(threadId, deriveThreadTitle(content));
}
