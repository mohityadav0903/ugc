import { Skeleton } from '@/components/ui/skeleton';
import { ChatHeader } from './chat-header';

export function ChatPanelLoading() {
  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatHeader />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-2/3" />
        <Skeleton className="ml-auto h-16 w-1/2" />
        <Skeleton className="h-20 w-3/4" />
      </div>
    </main>
  );
}
