import { CloudOff } from 'lucide-react';
import { RefreshCw as RefreshCwIconData, LoaderCircle as LoaderCircleIconData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import type { DataSource, SaveStatus } from '@/hooks/useBajas';
import './BajasBanner.css';

interface BajasBannerProps {
  isConfigured: boolean;
  dataSource: DataSource;
  bajasCount: number;
  saveStatus: SaveStatus;
  onRetrySync: () => void | Promise<void>;
}

export function BajasBanner({
  isConfigured,
  dataSource,
  bajasCount,
  saveStatus,
  onRetrySync,
}: BajasBannerProps) {
  if (bajasCount === 0) return null;

  if (isConfigured && dataSource === 'local') {
    return (
      <div className="bajas-banner bajas-banner--warn" role="status">
        <CloudOff size={16} aria-hidden="true" />
        <div className="bajas-banner__body">
          <strong>Datos solo en este navegador.</strong>{' '}
        </div>
        <button
          type="button"
          className="bajas-banner__action"
          onClick={() => void onRetrySync()}
          disabled={saveStatus === 'saving'}
          aria-label="Reintentar sincronización"
          title="Reintentar sync"
        >
          <MorphingIcon
            icon={saveStatus === 'saving' ? LoaderCircleIconData : RefreshCwIconData}
            size={14}
            className={saveStatus === 'saving' ? 'bajas-banner__spin' : ''}
            aria-hidden="true"
          />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="bajas-banner bajas-banner--info" role="status">
        <CloudOff size={16} aria-hidden="true" />
        <div className="bajas-banner__body">
          Almacenamiento no configurado. Los datos viven solo en este navegador.
        </div>
      </div>
    );
  }

  return null;
}
