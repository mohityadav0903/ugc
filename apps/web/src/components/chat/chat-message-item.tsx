'use client';

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { getMergedToolInvocations } from '@/lib/chat/streaming';
import type { UgcToolInvocation } from '@/lib/chat/tools';
import type { Message as ChatMessage } from '@ai-sdk/react';
import { UgcPipelineToolCard } from './ugc-pipeline-tool-card';

interface ChatMessageItemProps {
  message: ChatMessage;
}

function isHiddenSystemMessage(message: ChatMessage): boolean {
  if (message.role !== 'user') return false;
  if (typeof message.id === 'string' && message.id.startsWith('asset-preview-')) return true;
  return (message.parts ?? []).some(
    (part) => part.type === 'text' && part.text.startsWith('Asset previews for your picks.'),
  );
}

function getMergedToolInvocationsFromMessage(message: ChatMessage): UgcToolInvocation[] {
  return getMergedToolInvocations(message);
}

function renderAssistantContent(message: ChatMessage) {
  const toolInvocations = getMergedToolInvocationsFromMessage(message);
  const parts = message.parts ?? [];
  const textFromParts = parts
    .filter((part): part is Extract<(typeof parts)[number], { type: 'text' }> => part.type === 'text')
    .filter((part) => part.text.trim())
    .map((part, index) => <MessageResponse key={`text-${index}`}>{part.text}</MessageResponse>);
  const text = message.content.trim();

  return (
    <>
      {toolInvocations.map((invocation) => (
        <UgcPipelineToolCard key={invocation.toolCallId} invocation={invocation} />
      ))}
      {textFromParts.length > 0 ? textFromParts : text ? <MessageResponse>{text}</MessageResponse> : null}
    </>
  );
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  if (isHiddenSystemMessage(message)) return null;

  return (
    <Message from={message.role}>
      <MessageContent className="gap-3">
        {message.role === 'assistant' ? (
          renderAssistantContent(message)
        ) : (
          <MessageResponse>{message.content}</MessageResponse>
        )}
      </MessageContent>
    </Message>
  );
}
