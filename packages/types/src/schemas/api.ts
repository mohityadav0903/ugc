import { z } from 'zod';
import { MessageRoles } from '../constants/messages';

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
    content: z.string(),
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
