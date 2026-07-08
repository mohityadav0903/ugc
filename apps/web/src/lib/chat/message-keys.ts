import type { Message } from '@ai-sdk/react';

export function getMessageKey(message: Message, index: number): string {
  if (typeof message.id === 'string' && message.id.length > 0) return message.id;
  const content =
    typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.parts ?? message.content ?? '');
  return `msg-${index}-${message.role}-${content.slice(0, 24)}`;
}
