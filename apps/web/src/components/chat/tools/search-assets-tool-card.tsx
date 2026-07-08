'use client';

import type { UgcToolInvocation } from '@/lib/chat/tools';
import { isUgcToolInProgress } from '@/lib/chat/tools';
import type { AssetCandidate, SearchAssetsResult } from '@ugc/types';
import { ImagesIcon } from 'lucide-react';
import { ToolStepAccordion } from './tool-step-accordion';

interface SearchAssetsToolCardProps {
  invocation: UgcToolInvocation;
}

function CandidateThumb({ candidate }: { candidate: AssetCandidate }) {
  if (!candidate.thumbnailUrl) return null;
  return (
    <img
      src={candidate.thumbnailUrl}
      alt={candidate.title ?? candidate.label}
      className="size-14 rounded object-cover"
      loading="lazy"
    />
  );
}

function CandidateRow({ candidate }: { candidate: AssetCandidate }) {
  return (
    <div className="flex gap-2 rounded-md border border-border/60 p-2">
      <CandidateThumb candidate={candidate} />
      <div className="min-w-0 flex-1 text-xs">
        <p className="truncate font-medium">{candidate.title ?? candidate.label}</p>
        <p className="truncate text-muted-foreground">
          {[candidate.source, candidate.durationSec ? `${candidate.durationSec}s` : null, candidate.meta]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </div>
  );
}

export function SearchAssetsToolCard({ invocation }: SearchAssetsToolCardProps) {
  const isLoading = isUgcToolInProgress(invocation);
  const result = invocation.result as SearchAssetsResult | undefined;
  const gifQuery = typeof invocation.args?.gifQuery === 'string' ? invocation.args.gifQuery : undefined;
  const summary =
    result?.ok
      ? `${result.memes.length} memes · ${result.backgrounds.length} bgs`
      : result && !result.ok
        ? 'Failed'
        : undefined;

  return (
    <ToolStepAccordion
      title="Searching assets"
      icon={<ImagesIcon className="size-4 shrink-0 text-muted-foreground" />}
      summary={summary}
      isLoading={isLoading}
    >
      {gifQuery ? <p className="truncate text-muted-foreground">Meme: {gifQuery}</p> : null}
      {isLoading ? <div className="mt-2 h-12 animate-pulse rounded-md bg-muted" /> : null}
      {result?.ok ? (
        <div className="space-y-3 text-muted-foreground">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Top memes</p>
            {result.memes.slice(0, 3).map((candidate) => (
              <CandidateRow key={candidate.id} candidate={candidate} />
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Top backgrounds</p>
            {result.backgrounds.slice(0, 3).map((candidate) => (
              <CandidateRow key={candidate.id} candidate={candidate} />
            ))}
          </div>
          <p>{result.audio.length} audio tracks</p>
        </div>
      ) : null}
      {result && !result.ok ? <p className="text-destructive">{result.error}</p> : null}
    </ToolStepAccordion>
  );
}
