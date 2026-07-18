import type { VacancyType } from '@/lib/autoVacancies';
import { Badge } from './Badge';

const VACANCY_TYPE_VARIANT: Record<
  VacancyType,
  'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error' | 'purple'
> = {
  autorizado: 'success',
  backup: 'teal',
  starlite: 'purple',
};

const VACANCY_TYPE_LABEL: Record<VacancyType, string> = {
  autorizado: 'Plantilla Autorizada',
  backup: 'Backup',
  starlite: 'Starlite',
};

export function VacancyTypeBadge({ type }: { type: VacancyType }) {
  return (
    <Badge variant={VACANCY_TYPE_VARIANT[type]}>
      {VACANCY_TYPE_LABEL[type]}
    </Badge>
  );
}
