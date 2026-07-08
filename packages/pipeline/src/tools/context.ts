import type { ServerConfig } from '@ugc/types';

export interface PipelineToolContext {
  config: ServerConfig;
  threadId: string;
}

export function toToolFailure(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : 'Tool execution failed';
  return { ok: false, error: message };
}
