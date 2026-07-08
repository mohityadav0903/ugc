import { ModeToggle } from '@/components/theme/mode-toggle';

export function ChatHeader() {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
      <div>
        <p className="mb-1 text-muted-foreground text-xs uppercase tracking-wider">
          UGC Studio
        </p>
        <h1 className="font-semibold text-lg">Chat to generate TikTok-style promos</h1>
      </div>
      <ModeToggle />
    </header>
  );
}
