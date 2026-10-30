import { BadgeCheck, CircleGauge, Clock3, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { TaskStatus } from './types';

const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  pending: Clock3,
  in_progress: CircleGauge,
  completed: BadgeCheck,
};

export function KanbanStatusBadge({
  status,
  label,
}: {
  status: TaskStatus;
  label: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge className="badge--compact" data-state={status}>
      <Icon size="var(--icon-size-sm)" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
