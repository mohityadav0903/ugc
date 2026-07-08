'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Skeleton } from '@/components/ui/skeleton';
import { shouldShowThinking } from '@/lib/chat/streaming';
import type { Message as ChatMessage } from '@ai-sdk/react';
import { ClapperboardIcon } from 'lucide-react';
import { ChatMessageItem } from './chat-message-item';
import { getMessageKey } from '@/lib/chat/message-keys';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
}

export function ChatMessages({ messages, isLoading, status }: ChatMessagesProps) {
  const showThinking = shouldShowThinking(messages, isLoading, status);

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto w-full max-w-3xl gap-6">
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<ClapperboardIcon className="size-8" />}
            title="Generate a UGC promo in one message"
            description="Paste a product URL or describe the vibe — I'll build a short TikTok-style video with meme GIFs, b-roll, and a punchy hook."
          />
        ) : null}
        {messages.map((message, index) => (
          <ChatMessageItem key={getMessageKey(message, index)} message={message} />
        ))}
        {showThinking ? (
          <Message from="assistant">
            <MessageContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
                <p className="text-muted-foreground text-sm">Thinking…</p>
              </div>
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
