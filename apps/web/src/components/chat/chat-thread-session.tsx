'use client';

import { useChat } from '@ai-sdk/react';
import { ApiRoutes } from '@ugc/types';
import type { Message } from '@ai-sdk/react';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { fetchThreadMessages } from '@/lib/api';
import { SwrKeys } from '@/lib/swr/keys';
import { ChatPanel } from './chat-panel';

interface ChatThreadSessionProps {
  threadId: string;
  initialMessages: Message[];
}

export function ChatThreadSession({ threadId, initialMessages }: ChatThreadSessionProps) {
  const { mutate } = useSWRConfig();

  const { messages, isLoading, status, error, append, reload } = useChat({
    api: ApiRoutes.chat,
    id: threadId,
    body: { threadId },
    initialMessages,
    maxSteps: 8,
    streamProtocol: 'data',
    onFinish: () => {
      void mutate(SwrKeys.threadMessages(threadId), () => fetchThreadMessages(threadId));
    },
    onError: (chatError) => {
      console.error('[chat] client error:', chatError);
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      void append({ id: crypto.randomUUID(), role: 'user', content: text });
    },
    [append],
  );

  const retry = useCallback(() => {
    void reload();
  }, [reload]);

  const isRetrying = status === 'submitted' || status === 'streaming';

  return (
    <ChatPanel
      error={error}
      isLoading={isLoading}
      isRetrying={isRetrying}
      messages={messages}
      onRetry={retry}
      onSend={sendMessage}
      status={status}
    />
  );
}
