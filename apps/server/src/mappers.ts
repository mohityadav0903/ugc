import type { Database, MessageRecord, ThreadRecord } from '@ugc/db';
import { DefaultThreadTitle, MessageRoles, ToolNames } from '@ugc/types';
import type { MessageMetadata } from '@ugc/types';

export interface ThreadSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: MessageRecord['metadata'];
  createdAt: number;
}

export function toThreadSummary(thread: ThreadRecord): ThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

export function toMessageDto(message: MessageRecord): MessageDto | null {
  if (message.role === MessageRoles.tool) return null;
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
  };
}

function metadataFromGeneration(planJson: string, videoUrl: string): MessageMetadata {
  try {
    const parsed = JSON.parse(planJson) as {
      hook?: string;
      vibe?: string;
      sourceUrl?: string;
      trace?: { resolvedUrl?: string };
    };

    return {
      videoUrl,
      hook: parsed.hook,
      vibe: parsed.vibe,
      sourceUrl: parsed.sourceUrl ?? parsed.trace?.resolvedUrl,
      toolName: ToolNames.renderUgcVideo,
    };
  } catch {
    return {
      videoUrl,
      toolName: ToolNames.renderUgcVideo,
    };
  }
}

export async function listThreadMessages(db: Database, threadId: string): Promise<MessageDto[]> {
  const [messages, generations] = await Promise.all([
    db.listMessages(threadId),
    db.listGenerations(threadId),
  ]);

  const generationByMessageId = new Map(
    generations
      .filter((generation) => generation.messageId)
      .map((generation) => [generation.messageId!, generation]),
  );

  return messages
    .map((message) => {
      const dto = toMessageDto(message);
      if (!dto) return null;

      if (dto.role === MessageRoles.assistant && !dto.metadata?.videoUrl) {
        const generation = generationByMessageId.get(message.id);
        if (generation) {
          return {
            ...dto,
            metadata: metadataFromGeneration(generation.planJson, generation.videoUrl),
          };
        }
      }

      return dto;
    })
    .filter((message): message is MessageDto => message !== null);
}

export function deriveThreadTitle(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (!trimmed) return DefaultThreadTitle;
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}
