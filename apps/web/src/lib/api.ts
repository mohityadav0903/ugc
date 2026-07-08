import { ApiRoutes } from '@ugc/types';
import type { ThreadMessagesResponse, ThreadSummary } from './types';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function listThreads(): Promise<ThreadSummary[]> {
  const payload = await parseJson<{ threads: ThreadSummary[] }>(await fetch(ApiRoutes.threads));
  return payload.threads;
}

export async function createThread(title?: string): Promise<ThreadSummary> {
  const payload = await parseJson<{ thread: ThreadSummary }>(
    await fetch(ApiRoutes.threads, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(title ? { title } : {}),
    }),
  );
  return payload.thread;
}

export async function fetchThreadMessages(threadId: string): Promise<ThreadMessagesResponse> {
  return parseJson<ThreadMessagesResponse>(await fetch(ApiRoutes.threadMessages(threadId)));
}

export async function deleteThread(threadId: string): Promise<void> {
  await parseJson(await fetch(ApiRoutes.thread(threadId), { method: 'DELETE' }));
}
