import { ExternalLinkIcon } from 'lucide-react';

interface VideoMessageProps {
  url: string;
  embedded?: boolean;
}

export function VideoMessage({ url, embedded = false }: VideoMessageProps) {
  const player = (
    <>
      <video
        className="aspect-[9/16] w-full rounded-md bg-black object-contain [&:fullscreen]:object-contain"
        controls
        playsInline
        preload="metadata"
        src={url}
      />
      <a
        className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] bg-secondary px-2.5 text-[0.8rem] text-secondary-foreground hover:bg-secondary/80"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLinkIcon className="size-3.5" />
        Open video
      </a>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-2">{player}</div>;
  }

  return (
    <div className="mt-2 w-full max-w-xs overflow-hidden rounded-xl border border-border p-2">
      {player}
    </div>
  );
}
