'use client';

import useSWR from 'swr';
import { fetchThreadMessages } from '@/lib/api';
import { SwrKeys } from '@/lib/swr/keys';
import type { ThreadMessagesResponse } from '@/lib/types';

export function useThreadMessages(threadId: string | undefined) {
  return useSWR<ThreadMessagesResponse>(
    threadId ? SwrKeys.threadMessages(threadId) : null,
    () => fetchThreadMessages(threadId!),
  );
}
