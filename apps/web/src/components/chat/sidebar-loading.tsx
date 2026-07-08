import { Skeleton } from '@/components/ui/skeleton';

export function SidebarLoading() {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </aside>
  );
}
