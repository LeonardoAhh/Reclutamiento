import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-surface-card', className)}
      {...props}
    />
  );
}

export { Skeleton };
