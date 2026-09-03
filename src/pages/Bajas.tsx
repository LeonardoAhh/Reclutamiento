import { useMemo, useState } from 'react';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { RequisicionSheet } from '@/components/ui/RequisicionSheet';
import { BajaDetailSheet } from '@/components/ui/BajaDetailSheet';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useBajas } from '@/hooks/useBajas';
import {
  computeMonthlyComparison,
  normalizePuesto,
  type BajaWithCobertura,
} from '@/lib/bajas';
import { bajaKey, buildRequisicionCodes } from '@/lib/requisicion';
import type { Baja } from '@/lib/types';
import { currentYearMx } from '@/lib/dates';
import { toast } from '@/lib/notify';
import {
  BajasHero,
  BajasBanner,
  BajasFilters,
  BajasChart,
  BajasPorPuesto,
  BajasDetalle,
  CubrirVacanteModal,
} from './bajas-components';
import './Bajas.css';

const currentYear = currentYearMx();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function Bajas() {
  const { employees } = useSupabaseData();
  const {
    bajas,
    loading,
    importBajas,
    dataSource,
    isConfigured,
    retrySync,
    saveStatus,
    marcarCubierta,
    desmarcarCubierta,
    updateTurnosOnly,
    applyTurnosUpdate,
  } = useBajas();

  const [year, setYear] = useState<number>(currentYear);
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [puestoFilter, setPuestoFilter] = useState<string>('');
  const [cubrirTarget, setCubrirTarget] = useState<Baja | null>(null);
  const [requisicionTarget, setRequisicionTarget] = useState<Baja | null>(null);
  const [detalleTarget, setDetalleTarget] = useState<BajaWithCobertura | null>(null);

  // Clave compuesta de filtros para resetear páginas al cambiar de contexto
  const filterKey = `${year}-${areaFilter}-${puestoFilter}`;

  // Códigos VAC-NN derivados de todas las bajas conocidas. Determinístico.
  const requisicionCodes = useMemo(() => buildRequisicionCodes(bajas), [bajas]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.area);
    for (const b of bajas) set.add(b.area);
    return Array.from(set).sort();
  }, [employees, bajas]);

  // Dropdown de puesto usa la versión normalizada (sin categoría A/B/C/D)
  const puestosForArea = useMemo(() => {
    const set = new Set<string>();
    const matches = (a: string) => !areaFilter || a === areaFilter;
    for (const e of employees) if (matches(e.area)) set.add(normalizePuesto(e.puesto));
    for (const b of bajas) if (matches(b.area)) set.add(normalizePuesto(b.puesto));
    return Array.from(set).filter(Boolean).sort();
  }, [employees, bajas, areaFilter]);

  const comparison = useMemo(
    () =>
      computeMonthlyComparison(bajas, employees, year, {
        area: areaFilter || undefined,
        puesto: puestoFilter || undefined,
      }),
    [bajas, employees, year, areaFilter, puestoFilter]
  );

  const { months, byPuesto, bajasConCobertura } = comparison;

  // Para el chart: alto relativo según el máximo de bajas+ingresos del año.
  const chartMax = useMemo(() => {
    let m = 0;
    for (const row of months) {
      if (row.bajas > m) m = row.bajas;
      if (row.ingresos > m) m = row.ingresos;
    }
    return Math.max(m, 1);
  }, [months]);

  return (
    <BoneyardSkeleton
      name="bajas-page"
      loading={loading && bajas.length === 0}
      loadingLabel="Cargando bajas…"
    >
      <main className="bajas container" id="page-bajas">
        <BajasHero
          onImportBajas={importBajas}
          updateTurnosOnly={updateTurnosOnly}
          applyTurnosUpdate={applyTurnosUpdate}
        />

        <BajasBanner
          isConfigured={isConfigured}
          dataSource={dataSource}
          bajasCount={bajas.length}
          saveStatus={saveStatus}
          onRetrySync={retrySync}
        />

        <BajasFilters
          year={year}
          yearOptions={YEAR_OPTIONS}
          onYearChange={setYear}
          areaFilter={areaFilter}
          areas={areas}
          onAreaChange={setAreaFilter}
          puestoFilter={puestoFilter}
          puestosForArea={puestosForArea}
          onPuestoChange={setPuestoFilter}
        />

        <BajasChart months={months} chartMax={chartMax} year={year} />

        <div className="bajas__grid">
          <BajasPorPuesto byPuesto={byPuesto} filterKey={filterKey} />

          <BajasDetalle
            year={year}
            bajasConCobertura={bajasConCobertura}
            loading={loading}
            totalBajasKnown={bajas.length}
            onSelectBaja={setDetalleTarget}
            filterKey={filterKey}
          />
        </div>

        <BajaDetailSheet
          isOpen={detalleTarget !== null}
          baja={detalleTarget}
          requisicionCode={
            detalleTarget ? requisicionCodes.get(bajaKey(detalleTarget)) ?? null : null
          }
          onClose={() => setDetalleTarget(null)}
          onCubrir={(b) => {
            setDetalleTarget(null);
            setCubrirTarget(b);
          }}
          onRequisicion={(b) => {
            setDetalleTarget(null);
            setRequisicionTarget(b);
          }}
        />

        <CubrirVacanteModal
          isOpen={cubrirTarget !== null}
          baja={cubrirTarget}
          onClose={() => setCubrirTarget(null)}
          onSave={async (n, f, note) => {
            const res = await marcarCubierta(n, f, note);
            if (res.ok) toast.success({ title: 'Vacante cubierta' });
            else toast.error({ title: 'No se pudo marcar como cubierta' });
            return res;
          }}
          onClear={async (n) => {
            const res = await desmarcarCubierta(n);
            if (res.ok) toast.info({ title: 'Cobertura removida' });
            else toast.error({ title: 'No se pudo remover la cobertura' });
            return res;
          }}
        />

        <RequisicionSheet
          isOpen={requisicionTarget !== null}
          baja={requisicionTarget}
          employees={employees}
          codigo={
            requisicionTarget
              ? requisicionCodes.get(bajaKey(requisicionTarget)) ?? null
              : null
          }
          onClose={() => setRequisicionTarget(null)}
        />
      </main>
    </BoneyardSkeleton>
  );
}
