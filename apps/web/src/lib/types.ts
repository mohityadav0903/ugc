export interface ThreadSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageMetadata {
  videoUrl?: string;
  sourceUrl?: string;
  hook?: string;
  vibe?: string;
  toolName?: string;
}

export interface MessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: MessageMetadata | null;
  createdAt: number;
}

export interface ThreadMessagesResponse {
  messages: MessageDto[];
  uiMessages?: Record<string, unknown>[];
}
