'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getChatErrorDetails } from '@/lib/chat/errors';
import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react';

interface ChatErrorBannerProps {
  error: Error;
  isRetrying: boolean;
  onRetry: () => void;
}

export function ChatErrorBanner({ error, isRetrying, onRetry }: ChatErrorBannerProps) {
  const details = getChatErrorDetails(error.message);

  return (
    <div className="shrink-0 border-t border-border px-4 pt-4">
      <Card className="mx-auto max-w-3xl border-destructive/40 bg-destructive/5 py-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium text-sm">{details.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{error.message}</p>
              {details.hint ? (
                <p className="text-muted-foreground text-xs">{details.hint}</p>
              ) : null}
            </div>
          </div>
          <Button
            className="shrink-0"
            disabled={isRetrying}
            onClick={onRetry}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcwIcon className={isRetrying ? 'size-4 animate-spin' : 'size-4'} />
            {isRetrying ? 'Retrying…' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
