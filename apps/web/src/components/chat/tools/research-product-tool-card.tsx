'use client';

import type { UgcToolInvocation } from '@/lib/chat/tools';
import { isUgcToolInProgress } from '@/lib/chat/tools';
import type { ResearchProductResult } from '@ugc/types';
import { SearchIcon } from 'lucide-react';
import { ToolStepAccordion } from './tool-step-accordion';

interface ResearchProductToolCardProps {
  invocation: UgcToolInvocation;
}

export function ResearchProductToolCard({ invocation }: ResearchProductToolCardProps) {
  const isLoading = isUgcToolInProgress(invocation);
  const result = invocation.result as ResearchProductResult | undefined;
  const url = typeof invocation.args?.url === 'string' ? invocation.args.url : undefined;
  const summary =
    result?.ok ? result.productName : result && !result.ok ? 'Failed' : undefined;

  return (
    <ToolStepAccordion
      title="Researching product"
      icon={<SearchIcon className="size-4 shrink-0 text-muted-foreground" />}
      summary={summary}
      isLoading={isLoading}
    >
      {url ? <p className="truncate text-muted-foreground">{url}</p> : null}
      {isLoading ? <div className="mt-2 h-12 animate-pulse rounded-md bg-muted" /> : null}
      {result?.ok ? (
        <div className="space-y-1">
          <p className="font-medium">{result.productName}</p>
          {result.tagline ? <p className="text-muted-foreground">{result.tagline}</p> : null}
          <p className="text-muted-foreground">Audience: {result.audience}</p>
        </div>
      ) : null}
      {result && !result.ok ? <p className="text-destructive">{result.error}</p> : null}
    </ToolStepAccordion>
  );
}
