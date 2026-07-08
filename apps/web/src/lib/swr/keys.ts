import { ApiRoutes } from '@ugc/types';

export const SwrKeys = {
  threads: ApiRoutes.threads,
  threadMessages: (threadId: string) => ApiRoutes.threadMessages(threadId),
} as const;
