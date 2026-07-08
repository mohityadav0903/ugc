'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useThreads } from '@/hooks/use-threads';
import { WebRoutes } from '@/lib/routes';
import { SidebarLoading } from './sidebar-loading';
import { ThreadSidebar } from './thread-sidebar';

export function ThreadSidebarSlot() {
  const router = useRouter();
  const pathname = usePathname();
  const { threads, isLoading, createNewThread, removeThread } = useThreads();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const activeThreadId = pathname.match(/\/chat\/([^/]+)/)?.[1] ?? '';

  if (isLoading) {
    return <SidebarLoading />;
  }

  return (
    <ThreadSidebar
      activeThreadId={activeThreadId}
      deletingThreadId={deletingThreadId}
      isCreating={isCreating}
      onCreate={() => {
        setIsCreating(true);
        void createNewThread()
          .then((thread) => router.push(WebRoutes.chat(thread.id)))
          .finally(() => setIsCreating(false));
      }}
      onDelete={(threadId) => {
        const remaining = threads.filter((thread) => thread.id !== threadId);
        setDeletingThreadId(threadId);
        void removeThread(threadId)
          .then(() => {
            if (threadId !== activeThreadId) return;
            if (remaining.length > 0) {
              router.push(WebRoutes.chat(remaining[0].id));
              return;
            }
            router.push(WebRoutes.chatIndex);
          })
          .finally(() => setDeletingThreadId(null));
      }}
      onSelect={(threadId) => router.push(WebRoutes.chat(threadId))}
      threads={threads}
    />
  );
}
