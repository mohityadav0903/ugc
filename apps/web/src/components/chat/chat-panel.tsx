'use client';

import type { Message as ChatMessage } from '@ai-sdk/react';
import { ChatComposer } from './chat-composer';
import { ChatErrorBanner } from './chat-error-banner';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';

type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  status: ChatStatus;
  error: Error | undefined;
  isRetrying: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
}

export function ChatPanel({
  messages,
  isLoading,
  status,
  error,
  isRetrying,
  onSend,
  onRetry,
}: ChatPanelProps) {
  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatHeader />
      <ChatMessages isLoading={isLoading && !error} messages={messages} status={status} />
      {error ? <ChatErrorBanner error={error} isRetrying={isRetrying} onRetry={onRetry} /> : null}
      <ChatComposer onSubmit={onSend} status={status} />
    </main>
  );
}
