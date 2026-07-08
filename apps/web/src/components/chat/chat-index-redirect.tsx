'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatPanelLoading } from '@/components/chat/chat-panel-loading';
import { useThreads } from '@/hooks/use-threads';
import { WebRoutes } from '@/lib/routes';

export function ChatIndexRedirect() {
  const router = useRouter();
  const { threads, isLoading, createNewThread } = useThreads();

  useEffect(() => {
    if (isLoading) return;

    if (threads.length > 0) {
      router.replace(WebRoutes.chat(threads[0].id));
      return;
    }

    void createNewThread().then((thread) => {
      router.replace(WebRoutes.chat(thread.id));
    });
  }, [createNewThread, isLoading, router, threads]);

  return <ChatPanelLoading />;
}
