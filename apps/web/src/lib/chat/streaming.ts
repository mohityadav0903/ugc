import type { Message as ChatMessage } from '@ai-sdk/react';
import { mergeToolInvocationsByCallId, getUgcToolInvocations, isUgcToolInProgress } from './tools';
import type { UgcToolInvocation } from './tools';

export function getMergedToolInvocations(message: ChatMessage): UgcToolInvocation[] {
  const fromTopLevel = getUgcToolInvocations(message.toolInvocations as UgcToolInvocation[] | undefined);
  const fromParts = getUgcToolInvocations(
    (message.parts ?? [])
      .filter((part) => part.type === 'tool-invocation')
      .map((part) => part.toolInvocation as UgcToolInvocation),
  );

  return mergeToolInvocationsByCallId([...fromTopLevel, ...fromParts]);
}

export function shouldShowThinking(
  messages: ChatMessage[],
  isLoading: boolean,
  status?: 'submitted' | 'streaming' | 'ready' | 'error',
): boolean {
  const inFlight = status ? status === 'submitted' || status === 'streaming' : isLoading;
  if (!inFlight) return false;

  const last = messages.at(-1);
  if (!last || last.role === 'user') return true;

  if (last.role === 'assistant') {
    const tools = getMergedToolInvocations(last);
    if (tools.some(isUgcToolInProgress)) return false;

    const hasText =
      last.content.trim().length > 0 ||
      (last.parts ?? []).some((part) => part.type === 'text' && part.text.trim().length > 0);

    return !hasText && tools.length === 0;
  }

  return false;
}
