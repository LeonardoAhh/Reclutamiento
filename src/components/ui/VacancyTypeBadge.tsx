import type { VacancyType } from '@/lib/autoVacancies';
import { Badge, StarliteBadge } from './Badge';

const VACANCY_TYPE_VARIANT: Record<
  Exclude<VacancyType, 'starlite'>,
  'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error'
> = {
  autorizado: 'success',
  backup: 'teal',
};

const VACANCY_TYPE_LABEL: Record<VacancyType, string> = {
  autorizado: 'Plantilla Autorizada',
  backup: 'Backup',
  starlite: 'Starlite',
};

export function VacancyTypeBadge({ type }: { type: VacancyType }) {
  if (type === 'starlite') {
    return <StarliteBadge />;
  }
  
  return (
    <Badge variant={VACANCY_TYPE_VARIANT[type]}>
      {VACANCY_TYPE_LABEL[type]}
    </Badge>
  );
}
