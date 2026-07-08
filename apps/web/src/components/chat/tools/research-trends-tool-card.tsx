'use client';

import type { UgcToolInvocation } from '@/lib/chat/tools';
import { isUgcToolInProgress } from '@/lib/chat/tools';
import type { ResearchTrendsResult } from '@ugc/types';
import { TrendingUpIcon } from 'lucide-react';
import { ToolStepAccordion } from './tool-step-accordion';

interface ResearchTrendsToolCardProps {
  invocation: UgcToolInvocation;
}

export function ResearchTrendsToolCard({ invocation }: ResearchTrendsToolCardProps) {
  const isLoading = isUgcToolInProgress(invocation);
  const result = invocation.result as ResearchTrendsResult | undefined;
  const niche = typeof invocation.args?.niche === 'string' ? invocation.args.niche : undefined;
  const summary =
    result?.ok
      ? `${result.famousMemes.length} memes · ${result.viralInfluencers.length} creators`
      : result && !result.ok
        ? 'Failed'
        : undefined;

  return (
    <ToolStepAccordion
      title="Scanning trends"
      icon={<TrendingUpIcon className="size-4 shrink-0 text-muted-foreground" />}
      summary={summary}
      isLoading={isLoading}
    >
      {niche ? <p className="text-muted-foreground">Niche: {niche}</p> : null}
      {isLoading ? <div className="mt-2 h-12 animate-pulse rounded-md bg-muted" /> : null}
      {result?.ok ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Source: {result.searchSource === 'tavily' ? 'web search' : 'meme catalog'}
          </p>
          {result.viralInfluencers.length > 0 ? (
            <div>
              <p className="font-medium">Influencers</p>
              {result.viralInfluencers.slice(0, 3).map((name) => (
                <p key={name} className="truncate text-muted-foreground">
                  {name}
                </p>
              ))}
            </div>
          ) : null}
          {result.famousMemes.length > 0 ? (
            <div>
              <p className="font-medium">Memes</p>
              {result.famousMemes.slice(0, 4).map((meme) => (
                <p key={meme} className="truncate">
                  {meme}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {result && !result.ok ? <p className="text-destructive">{result.error}</p> : null}
    </ToolStepAccordion>
  );
}
