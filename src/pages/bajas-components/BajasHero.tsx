import { BajasImporter } from '@/components/ui/BajasImporter';
import { TurnosUpdater } from '@/components/ui/TurnosUpdater';
import { toast } from '@/lib/notify';
import type { BajaRaw } from '@/lib/types';
import './BajasHero.css';

interface BajasHeroProps {
  onImportBajas: (raw: BajaRaw[]) => Promise<{
    ok: boolean;
    inserted: number;
    skipped: number;
    message?: string;
  }>;
  updateTurnosOnly: (raw: BajaRaw[]) => Promise<{
    ok: boolean;
    preview: Array<{ num_empleado: string; nombre: string; turno_anterior: string | undefined; turno_nuevo: string }>;
    updated: number;
    notFound: number;
  }>;
  applyTurnosUpdate: (raw: BajaRaw[]) => Promise<{ ok: boolean; updated: number }>;
  showActions?: boolean;
}

export function BajasHero({
  onImportBajas,
  updateTurnosOnly,
  applyTurnosUpdate,
  showActions = false,
}: BajasHeroProps) {
  return (
    <header className="bajas-hero">
      <h1 className="bajas-hero__title">Rotación</h1>
      {showActions && (
        <div className="bajas-hero__actions">
          <BajasImporter
            onImport={async (raw) => {
              const res = await onImportBajas(raw);
              if (res.ok) {
                toast.success({
                  title: 'Bajas registradas',
                });
              } else {
                toast.error({
                  title: 'Error al procesar archivo',
                });
              }
              return res;
            }}
          />
          <TurnosUpdater onPreview={updateTurnosOnly} onApply={applyTurnosUpdate} />
        </div>
      )}
    </header>
  );
}
