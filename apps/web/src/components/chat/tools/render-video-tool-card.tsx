'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { UgcToolInvocation } from '@/lib/chat/tools';
import { isUgcToolInProgress } from '@/lib/chat/tools';
import { isRenderUgcVideoSuccess } from '@ugc/types';
import { AlertCircleIcon, ClapperboardIcon } from 'lucide-react';

interface RenderVideoToolCardProps {
  invocation: UgcToolInvocation;
}

function cardTitle(invocation: UgcToolInvocation): string {
  if (invocation.state === 'result' && invocation.result && !isRenderUgcVideoSuccess(invocation.result)) {
    return 'Render failed';
  }

  switch (invocation.state) {
    case 'partial-call':
      return 'Preparing render…';
    case 'call':
      return 'Rendering video…';
    case 'result':
      return 'Video ready';
    default:
      return 'Render video';
  }
}

export function RenderVideoToolCard({ invocation }: RenderVideoToolCardProps) {
  const isGenerating = isUgcToolInProgress(invocation);
  const sourceUrl =
    (typeof invocation.args?.sourceUrl === 'string' ? invocation.args.sourceUrl : undefined) ||
    (invocation.result && isRenderUgcVideoSuccess(invocation.result)
      ? invocation.result.sourceUrl
      : undefined);
  const videoUrl =
    invocation.result && isRenderUgcVideoSuccess(invocation.result)
      ? invocation.result.videoUrl
      : undefined;
  const toolError =
    invocation.result && !isRenderUgcVideoSuccess(invocation.result)
      ? invocation.result.error
      : undefined;
  const hook =
    invocation.result && isRenderUgcVideoSuccess(invocation.result)
      ? invocation.result.hook
      : undefined;

  return (
    <Card className="w-72 shrink-0 gap-0 py-0">
      <CardHeader className="flex h-12 flex-row items-center gap-2 border-b border-border px-4 py-0">
        {isGenerating ? (
          <Spinner className="size-4 shrink-0" />
        ) : toolError ? (
          <AlertCircleIcon className="size-4 shrink-0 text-destructive" />
        ) : (
          <ClapperboardIcon className="size-4 shrink-0" />
        )}
        <CardTitle className="truncate font-medium text-sm">{cardTitle(invocation)}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="mb-3 h-4 truncate text-muted-foreground text-xs">
          {sourceUrl ? (
            <>
              Source: <span className="text-foreground">{sourceUrl}</span>
            </>
          ) : (
            <span className="invisible">Source:</span>
          )}
        </p>
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg bg-muted">
          {isGenerating ? <div className="absolute inset-0 animate-pulse bg-muted" /> : null}
          {!isGenerating && videoUrl ? (
            <video
              className="absolute inset-0 h-full w-full bg-black object-contain [&:fullscreen]:object-contain"
              controls
              playsInline
              preload="metadata"
              src={videoUrl}
            />
          ) : null}
          {!isGenerating && toolError ? (
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <p className="text-center text-destructive text-sm">{toolError}</p>
            </div>
          ) : null}
        </div>
        <div className="mt-3 h-10">
          {hook ? (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              Hook: <span className="text-foreground">{hook}</span>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
