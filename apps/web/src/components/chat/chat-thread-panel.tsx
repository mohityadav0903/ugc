'use client';

import { useThreadMessages } from '@/hooks/use-thread-messages';
import { toUiMessages } from '@/lib/messages';
import { ChatPanelLoading } from './chat-panel-loading';
import { ChatThreadSession } from './chat-thread-session';

interface ChatThreadPanelProps {
  threadId: string;
}

export function ChatThreadPanel({ threadId }: ChatThreadPanelProps) {
  const { data, error, isLoading } = useThreadMessages(threadId);

  if (isLoading && !data) {
    return <ChatPanelLoading />;
  }

  if (error) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-8">
        <p className="text-destructive text-sm">{error.message}</p>
      </main>
    );
  }

  return (
    <ChatThreadSession
      key={threadId}
      initialMessages={toUiMessages(data?.messages ?? [], data?.uiMessages)}
      threadId={threadId}
    />
  );
}
