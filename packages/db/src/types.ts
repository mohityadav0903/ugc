import type { MessageMetadata, MessageRole } from '@ugc/types';

export interface ThreadRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type StoredUiMessage = Record<string, unknown>;

export interface MessageRecord {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  metadata: MessageMetadata | null;
  createdAt: number;
}

export interface GenerationRecord {
  id: string;
  threadId: string;
  messageId: string | null;
  videoUrl: string;
  planJson: string;
  createdAt: number;
}

export interface CreateThreadInput {
  id?: string;
  title?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AddMessageInput {
  id?: string;
  threadId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata | null;
  createdAt?: number;
}

export interface AddGenerationInput {
  id?: string;
  threadId: string;
  messageId?: string | null;
  videoUrl: string;
  planJson: string;
  createdAt?: number;
}

export interface Database {
  listThreads(): Promise<ThreadRecord[]>;
  getThread(id: string): Promise<ThreadRecord | null>;
  createThread(input: CreateThreadInput): Promise<ThreadRecord>;
  updateThreadTitle(id: string, title: string): Promise<ThreadRecord>;
  deleteThread(id: string): Promise<void>;
  listMessages(threadId: string): Promise<MessageRecord[]>;
  addMessage(input: AddMessageInput): Promise<MessageRecord>;
  addGeneration(input: AddGenerationInput): Promise<GenerationRecord>;
  listGenerations(threadId: string): Promise<GenerationRecord[]>;
  getThreadUiMessages(threadId: string): Promise<StoredUiMessage[] | null>;
  setThreadUiMessages(threadId: string, messages: StoredUiMessage[]): Promise<void>;
}
