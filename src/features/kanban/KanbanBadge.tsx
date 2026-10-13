import { BadgeCheck, CircleGauge, ClipboardPenLine, Clock3, ListChecks, MessageSquareText, StickyNote, Waypoints, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { TaskKind, TaskStatus } from './types';
import type { KanbanCopy } from './copy';
import './KanbanBadge.css';

const KIND_ICONS: Record<TaskKind, LucideIcon> = {
  activity: ClipboardPenLine,
  process: Waypoints,
  interview: MessageSquareText,
  todo: ListChecks,
};
const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  pending: Clock3,
  in_progress: CircleGauge,
  completed: BadgeCheck,
  notes: StickyNote,
};
export function KanbanKindBadge({ kind, copy }: { kind: TaskKind; copy: KanbanCopy }) {
  const Icon = KIND_ICONS[kind];
  return <Badge className="badge--compact kanban-badge" data-kind={kind}>
    <Icon size="var(--icon-size-sm)" aria-hidden="true" />
    <span>{copy.kinds[kind]}</span>
  </Badge>;
}
export function KanbanStatusBadge({ status, copy }: { status: TaskStatus; copy: KanbanCopy }) {
  const Icon = STATUS_ICONS[status];
  return <Badge className="badge--compact kanban-badge" data-state={status}>
    <Icon size="var(--icon-size-sm)" aria-hidden="true" />
    <span>{copy.statuses[status]}</span>
  </Badge>;
}
