import {
  ToolNames,
  UgcPipelineToolNames,
  type RenderUgcVideoResult,
  type ResearchProductResult,
  type ResearchTrendsResult,
  type SearchAssetsResult,
} from '@ugc/types';

export type UgcToolInvocationState = 'partial-call' | 'call' | 'result';

export type UgcToolResult =
  | ResearchProductResult
  | ResearchTrendsResult
  | SearchAssetsResult
  | RenderUgcVideoResult;

export interface UgcToolInvocation {
  state: UgcToolInvocationState;
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
  result?: UgcToolResult;
}

export function isUgcPipelineTool(toolName: string): boolean {
  return (UgcPipelineToolNames as readonly string[]).includes(toolName);
}

export function isUgcToolInProgress(invocation: UgcToolInvocation): boolean {
  return invocation.state === 'partial-call' || invocation.state === 'call';
}

const TOOL_STATE_RANK: Record<UgcToolInvocationState, number> = {
  'partial-call': 0,
  call: 1,
  result: 2,
};

function pickPreferredToolInvocation(
  existing: UgcToolInvocation,
  incoming: UgcToolInvocation,
): UgcToolInvocation {
  const existingRank = TOOL_STATE_RANK[existing.state] ?? 0;
  const incomingRank = TOOL_STATE_RANK[incoming.state] ?? 0;
  if (incomingRank !== existingRank) {
    return incomingRank > existingRank ? incoming : existing;
  }
  if (incoming.result && !existing.result) return incoming;
  return existing;
}

export function mergeToolInvocationsByCallId(
  invocations: UgcToolInvocation[],
): UgcToolInvocation[] {
  const merged = new Map<string, UgcToolInvocation>();
  for (const invocation of invocations) {
    const existing = merged.get(invocation.toolCallId);
    merged.set(
      invocation.toolCallId,
      existing ? pickPreferredToolInvocation(existing, invocation) : invocation,
    );
  }
  return [...merged.values()];
}

export function getUgcToolInvocations(
  toolInvocations: UgcToolInvocation[] | undefined,
): UgcToolInvocation[] {
  return (toolInvocations ?? []).filter((invocation) => isUgcPipelineTool(invocation.toolName));
}

export { ToolNames };
