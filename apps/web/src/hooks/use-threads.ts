'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useCallback } from 'react';
import { createThread, deleteThread, listThreads } from '@/lib/api';
import { SwrKeys } from '@/lib/swr/keys';
import type { ThreadSummary } from '@/lib/types';

export function useThreads() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR<ThreadSummary[]>(SwrKeys.threads, listThreads);

  const createNewThread = useCallback(async () => {
    const created = await createThread();
    await mutate(
      (current) => [created, ...(current ?? [])],
      { revalidate: false },
    );
    return created;
  }, [mutate]);

  const removeThread = useCallback(
    async (threadId: string) => {
      await deleteThread(threadId);
      await mutate(
        (current) => (current ?? []).filter((thread) => thread.id !== threadId),
        { revalidate: false },
      );
      await globalMutate(SwrKeys.threadMessages(threadId), undefined, { revalidate: false });
    },
    [globalMutate, mutate],
  );

  return {
    threads: data ?? [],
    isLoading,
    error,
    createNewThread,
    removeThread,
    mutate,
  };
}
