import { BadgeCheck, Clock3, Hourglass } from 'lucide-react';
import type { DataUpdateRecordStatus } from './types';
import { useDataUpdateText } from './translations';
import { Badge } from '@/components/ui/Badge';

interface DataUpdateStatusProps {
  status: DataUpdateRecordStatus;
  showLabel?: boolean;
}

export function DataUpdateStatus({ status, showLabel = false }: DataUpdateStatusProps) {
  const t = useDataUpdateText();
  const label = status === 'completado' ? t('Completado') : status === 'pendiente' ? t('Pendiente') : t('En proceso');

  return (
    <Badge
      className={`data-update-status${showLabel ? ' data-update-status--with-label' : ''}`}
      variant={status === 'completado' ? 'success' : 'warning'}
      size={showLabel || status === 'en_proceso' ? 'compact' : 'icon'}
      role={!showLabel && status !== 'en_proceso' ? 'img' : undefined}
      aria-label={!showLabel && status !== 'en_proceso' ? label : undefined}
    >
      {status === 'completado' ? (
        <BadgeCheck aria-hidden="true" />
      ) : status === 'pendiente' ? (
        <Hourglass aria-hidden="true" />
      ) : showLabel ? (
        <Clock3 aria-hidden="true" />
      ) : (
        label
      )}
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}
