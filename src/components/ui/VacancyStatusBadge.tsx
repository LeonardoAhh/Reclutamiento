import type { VacancyStatus, VacancyPriority } from '@/lib/types';
import { VACANCY_STATUS_LABEL, VACANCY_PRIORITY_LABEL } from '@/lib/types';
import { Badge } from './Badge';

const STATUS_VARIANT: Record<
  VacancyStatus,
  'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error'
> = {
  abierta: 'coral',
  en_proceso: 'amber',
  pausa: 'default',
  cubierta: 'success',
  cancelada: 'error',
};

const PRIORITY_VARIANT: Record<
  VacancyPriority,
  'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error'
> = {
  alta: 'error',
  media: 'amber',
  baja: 'default',
};

export function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{VACANCY_STATUS_LABEL[status]}</Badge>;
}

export function VacancyPriorityBadge({ priority }: { priority: VacancyPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]}>{VACANCY_PRIORITY_LABEL[priority]}</Badge>
  );
}
