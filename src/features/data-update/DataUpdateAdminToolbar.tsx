import { FileJson2 } from 'lucide-react';
import { Toolbar, ToolbarGroup } from '@/components/ui/Toolbar';
import { useDataUpdateText } from './translations';

interface DataUpdateAdminToolbarProps {
  recordCount: number;
  busy: boolean;
  online: boolean;
  onShiftImport: () => void;
}

export function DataUpdateAdminToolbar({
  recordCount,
  busy,
  online,
  onShiftImport,
}: DataUpdateAdminToolbarProps) {
  const t = useDataUpdateText();

  return (
    <Toolbar
      label={t('Herramientas de administración')}
      className="data-update-admin__toolbar"
    >
      <ToolbarGroup label={t('Acciones de administración')} className="data-update-admin__actions">
        <button
          data-cuelume-tap=""
          type="button"
          className="btn-secondary data-update-admin__shift-import"
          hidden
          onClick={onShiftImport}
          disabled={busy || !online || recordCount === 0}
          aria-label={t('Actualizar turnos desde JSON')}
        >
          <FileJson2 aria-hidden="true" />
          {t('Cargar turnos')}
        </button>
      </ToolbarGroup>
    </Toolbar>
  );
}
