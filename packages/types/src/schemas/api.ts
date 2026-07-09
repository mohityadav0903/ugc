import { z } from 'zod';
import { MessageRoles } from '../constants/messages';

function extractTextFromParts(parts: unknown[]): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') return part;
      if (!part || typeof part !== 'object') return '';
      const record = part as { type?: string; text?: string };
      if (record.type === 'text' && typeof record.text === 'string') return record.text;
      return '';
    })
    .filter(Boolean)
    .join('');
}

/** Normalize AI SDK message content (string or parts array) to plain text. */
export function getMessageText(content: unknown, parts?: unknown): string {
  if (typeof content === 'string' && content.length > 0) return content;
  if (Array.isArray(parts) && parts.length > 0) return extractTextFromParts(parts);
  if (Array.isArray(content)) return extractTextFromParts(content);
  return typeof content === 'string' ? content : '';
}

export const messageContentSchema = z.union([z.string(), z.array(z.record(z.unknown()))]);

const chatToolInvocationSchema = z
  .object({
    state: z.enum(['partial-call', 'call', 'result']),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()).optional(),
    result: z.unknown().optional(),
  })
  .passthrough();

export const chatMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum([MessageRoles.user, MessageRoles.assistant]),
    content: messageContentSchema,
    toolInvocations: z.array(chatToolInvocationSchema).optional(),
    parts: z.array(z.record(z.unknown())).optional(),
    createdAt: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const chatRequestSchema = z.object({
  threadId: z.string().uuid(),
  messages: z.array(chatMessageSchema).min(1),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const createThreadRequestSchema = z.object({
  title: z.string().min(1).optional(),
});

export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;

export const messageMetadataSchema = z
  .object({
    videoUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
    toolName: z.string().optional(),
    hook: z.string().optional(),
    vibe: z.string().optional(),
  })
  .passthrough();

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;
