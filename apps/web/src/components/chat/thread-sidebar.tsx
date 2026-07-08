'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ThreadSummary } from '@/lib/types';
import { PlusIcon, Trash2Icon } from 'lucide-react';

interface ThreadSidebarProps {
  threads: ThreadSummary[];
  activeThreadId: string;
  deletingThreadId?: string | null;
  isCreating?: boolean;
  onSelect: (threadId: string) => void;
  onCreate: () => void;
  onDelete: (threadId: string) => void;
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  deletingThreadId = null,
  isCreating = false,
  onSelect,
  onCreate,
  onDelete,
}: ThreadSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 p-4">
        <h2 className="font-medium text-sm">Threads</h2>
        <Button disabled={isCreating} onClick={onCreate} size="sm" type="button" variant="outline">
          <PlusIcon className="size-4" />
          New
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-1">
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const isDeleting = deletingThreadId === thread.id;

            return (
              <div
                key={thread.id}
                className={cn(
                  'group flex items-center gap-1 rounded-lg',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                <Button
                  className="h-auto min-w-0 flex-1 justify-start px-3 py-2 text-left font-normal hover:bg-transparent"
                  disabled={isDeleting}
                  onClick={() => onSelect(thread.id)}
                  type="button"
                  variant="ghost"
                >
                  <span className="line-clamp-2 text-sm">{thread.title}</span>
                </Button>
                <Button
                  aria-label={`Delete ${thread.title}`}
                  className="mr-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={isDeleting}
                  onClick={() => onDelete(thread.id)}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
