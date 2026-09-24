import type { VacancyType } from '@/lib/autoVacancies';
import { StarliteBadge, PlantillaBadge, BackupBadge } from './Badge';

export function VacancyTypeBadge({ type, iconOnly }: { type: VacancyType, iconOnly?: boolean }) {
  if (type === 'starlite') {
    return <StarliteBadge />;
  }
  
  if (type === 'autorizado') {
    return <PlantillaBadge iconOnly={iconOnly} />;
  }

  if (type === 'backup') {
    return <BackupBadge iconOnly={iconOnly} />;
  }
  
  return null;
}
