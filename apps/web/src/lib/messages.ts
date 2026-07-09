import type { Message } from '@ai-sdk/react';
import { getMessageText, ToolNames } from '@ugc/types';
import type { UgcToolInvocation } from './chat/tools';
import { mergeToolInvocationsByCallId } from './chat/tools';
import type { MessageDto } from './types';

function reviveUiMessage(message: Record<string, unknown>, index: number): Message {
  const createdAt = message.createdAt;
  const rawContent = message.content;
  const rawParts = message.parts;
  const content = getMessageText(rawContent, rawParts);

  const revived = {
    ...message,
    id:
      typeof message.id === 'string' && message.id.length > 0
        ? message.id
        : `msg-${index}-${String(message.role)}`,
    role: message.role as Message['role'],
    content,
    ...(createdAt ? { createdAt: new Date(createdAt as string | number) } : {}),
  } as Message;

  if (Array.isArray(revived.toolInvocations)) {
    revived.toolInvocations = mergeToolInvocationsByCallId(
      revived.toolInvocations as UgcToolInvocation[],
    ) as Message['toolInvocations'];
  }

  return revived;
}

export function toUiMessages(
  messages: MessageDto[],
  uiMessages?: Record<string, unknown>[] | null,
): Message[] {
  if (uiMessages && uiMessages.length > 0) {
    return uiMessages.map((message, index) => reviveUiMessage(message, index));
  }

  let lastUserMessage = '';

  return messages.map((message) => {
    if (message.role === 'user') {
      lastUserMessage = message.content;
    }

    const base: Message = {
      id: message.id,
      role: message.role,
      content: message.content,
    };

    if (message.role !== 'assistant' || !message.metadata?.videoUrl) {
      return base;
    }

    return {
      ...base,
      toolInvocations: [
        {
          state: 'result' as const,
          toolCallId: `history-${message.id}`,
          toolName: ToolNames.renderUgcVideo,
          args: {
            message: lastUserMessage,
            url: message.metadata.sourceUrl ?? '',
          },
          result: {
            ok: true,
            videoUrl: message.metadata.videoUrl,
            hook: message.metadata.hook ?? '',
            vibe: message.metadata.vibe ?? '',
          },
        },
      ],
    };
  });
}
