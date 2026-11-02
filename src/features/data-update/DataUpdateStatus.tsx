import { BadgeCheck, Hourglass } from 'lucide-react';
import type { DataUpdateRecordStatus } from './types';
import { useDataUpdateText } from './translations';
import { Badge } from '@/components/ui/Badge';

interface DataUpdateStatusProps {
  status: DataUpdateRecordStatus;
}

export function DataUpdateStatus({ status }: DataUpdateStatusProps) {
  const t = useDataUpdateText();
  return (
    <Badge
      className="data-update-status"
      variant={status === 'completado' ? 'success' : 'warning'}
      size={status === 'en_proceso' ? 'compact' : 'icon'}
      role={status === 'en_proceso' ? undefined : 'img'}
      aria-label={status === 'completado' ? t('Completado') : status === 'pendiente' ? t('Pendiente') : undefined}
    >
      {status === 'completado' ? (
        <BadgeCheck aria-hidden="true" />
      ) : status === 'pendiente' ? (
        <Hourglass aria-hidden="true" />
      ) : (
        t('En proceso')
      )}
    </Badge>
  );
}
