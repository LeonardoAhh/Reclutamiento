import type { ReactNode } from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  label: string;
  className: string;
  children: ReactNode;
}

export function LoadingSkeleton({
  label,
  className,
  children,
}: LoadingSkeletonProps) {
  return (
    <div className={`loading-skeleton ${className}`} role="status" aria-label={label} aria-busy="true">
      {children}
    </div>
  );
}
