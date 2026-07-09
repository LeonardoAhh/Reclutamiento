import { Skeleton } from '@/components/ui/skeleton';

export default function PanelSkeleton({ rows = 8 }) {
  const list = Array.from({ length: rows });
  return (
    <div className="mt-6" data-testid="panel-skeleton" aria-hidden="true">
      {/* Desktop: table-like skeleton */}
      <div className="hidden overflow-hidden rounded-lg border border-hairline md:block">
        <Skeleton className="h-10 w-full rounded-none" />
        {list.map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-hairline px-3 py-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      {/* Mobile: row skeleton */}
      <div className="overflow-hidden rounded-lg border border-hairline md:hidden">
        {list.map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-hairline px-3 py-4 last:border-b-0">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
