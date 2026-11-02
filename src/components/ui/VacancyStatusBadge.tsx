import { VACANCY_STATUS_LABEL, VACANCY_PRIORITY_LABEL, type VacancyStatus, type VacancyPriority } from '@/lib/types';
import { Badge, type BadgeVariant } from './Badge';

const STATUS_VARIANT: Record<VacancyStatus, BadgeVariant> = {
  abierta: 'neutral',
  en_proceso: 'warning',
  pausa: 'warning',
  cubierta: 'success',
  cancelada: 'error',
};

const PRIORITY_VARIANT: Record<VacancyPriority, BadgeVariant> = {
  alta: 'error',
  media: 'warning',
  baja: 'neutral',
};

export function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{VACANCY_STATUS_LABEL[status]}</Badge>;
}

export function VacancyPriorityBadge({ priority }: { priority: VacancyPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{VACANCY_PRIORITY_LABEL[priority]}</Badge>;
}
