import type { ReactNode } from 'react';
import './ActionStateContent.css';

interface ActionStateContentProps {
  active: boolean;
  children: ReactNode;
}

export function ActionStateContent({ active, children }: ActionStateContentProps) {
  return <span className="action-state-content" data-active={active || undefined}>{children}</span>;
}
