import { useMemo, useState } from 'react';
import {
  Filter,
  CloudOff,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BajasImporter } from '@/components/ui/BajasImporter';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import { CubrirVacanteSheet } from '@/components/ui/CubrirVacanteSheet';
import { RequisicionSheet } from '@/components/ui/RequisicionSheet';
import {
  BajaDetailSheet,
  BajaCoberturaBadge,
} from '@/components/ui/BajaDetailSheet';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useBajas } from '@/hooks/useBajas';
import {
  computeMonthlyComparison,
  normalizePuesto,
  type BajaWithCobertura,
} from '@/lib/bajas';
import { bajaKey, buildRequisicionCodes } from '@/lib/requisicion';
import type { Baja } from '@/lib/types';
import { formatMonthLabel, formatShortDate, currentYearMx } from '@/lib/dates';
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
  } = useBajas();

  const [year, setYear] = useState<number>(currentYear);
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [puestoFilter, setPuestoFilter] = useState<string>('');
  const [cubrirTarget, setCubrirTarget] = useState<Baja | null>(null);
  const [requisicionTarget, setRequisicionTarget] = useState<Baja | null>(null);
  const [detalleTarget, setDetalleTarget] = useState<BajaWithCobertura | null>(null);

  // Códigos VAC-NN derivados de todas las bajas conocidas. Determinístico:
  // sirve igual en modo online y offline, y se conserva entre re-renders.
  const requisicionCodes = useMemo(() => buildRequisicionCodes(bajas), [bajas]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.area);
    for (const b of bajas) set.add(b.area);
    return Array.from(set).sort();
  }, [employees, bajas]);

  // Dropdown de puesto usa la versión normalizada (sin categoría A/B/C/D)
  // para que una sola opción agrupe todas las variantes. Coherente con la
  // lógica de cobertura.
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

  if (loading) {
    return (
      <main className="bajas container" id="page-bajas">
        <section className="bajas__hero">
          <div>
            <h1 className="bajas__title">Downsizing</h1>
          </div>
        </section>
        <section className="bajas__filters" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} width={160} radius="var(--rounded-md)" />
          ))}
        </section>
        <section className="bajas__chart-section">
          <Skeleton height={220} radius="var(--rounded-lg)" />
        </section>
        <div className="bajas__grid">
          <SkeletonTable rows={6} columns={['28%', '24%', '16%', '16%', '16%']} />
          <SkeletonTable rows={6} columns={['28%', '24%', '16%', '16%', '16%']} />
        </div>
      </main>
    );
  }

  return (
    <main className="bajas container" id="page-bajas">
      <section className="bajas__hero">
        <div>
          <h1 className="bajas__title">Downsizing</h1>
        </div>
        <div className="bajas__hero-actions">
          <BajasImporter onImport={importBajas} />
        </div>
      </section>

      {isConfigured && dataSource === 'local' && bajas.length > 0 && (
        <div className="bajas__banner bajas__banner--warn" role="status">
          <CloudOff size={16} aria-hidden="true" />
          <div className="bajas__banner-body">
            <strong>Datos solo en este navegador.</strong>{' '}
          </div>
          <button
            type="button"
            className="bajas__banner-action"
            onClick={() => void retrySync()}
            disabled={saveStatus === 'saving'}
            title="Reintentar sync"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {!isConfigured && bajas.length > 0 && (
        <div className="bajas__banner bajas__banner--info" role="status">
          <CloudOff size={16} aria-hidden="true" />
          <div className="bajas__banner-body">
            Almacenamiento no configurado. Los datos viven solo en este navegador.
          </div>
        </div>
      )}

      <section className="bajas__filters" aria-label="Filtros">
        <label className="bajas__filter">
          <span>Año</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="bajas__filter">
          <span>
            <Filter size={14} aria-hidden="true" /> Área
          </span>
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setPuestoFilter('');
            }}
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="bajas__filter">
          <span>Puesto</span>
          <select
            value={puestoFilter}
            onChange={(e) => setPuestoFilter(e.target.value)}
            disabled={puestosForArea.length === 0}
          >
            <option value="">Todos</option>
            {puestosForArea.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="bajas__chart-section" aria-label="Bajas vs ingresos por mes">
        <header className="bajas__section-head">
          <h2>Movimiento mensual</h2>
          <div className="bajas__legend">
            <span className="bajas__legend-item bajas__legend-item--bajas">
              <span className="bajas__legend-swatch" aria-hidden="true" /> Bajas
            </span>
            <span className="bajas__legend-item bajas__legend-item--ingresos">
              <span className="bajas__legend-swatch" aria-hidden="true" /> Ingresos
            </span>
          </div>
        </header>
        <div className="bajas__chart" role="img" aria-label={`Bajas e ingresos mensuales ${year}`}>
          {months.map((m) => {
            const bH = (m.bajas / chartMax) * 100;
            const iH = (m.ingresos / chartMax) * 100;
            const label = formatMonthLabel(m.month);
            return (
              <div key={m.month} className="bajas__chart-col">
                <div className="bajas__chart-bars">
                  <div
                    className="bajas__chart-bar bajas__chart-bar--bajas"
                    style={{ height: `${bH}%` }}
                    title={`${label}: ${m.bajas} bajas`}
                  >
                    {m.bajas > 0 && <span className="bajas__chart-bar-value">{m.bajas}</span>}
                  </div>
                  <div
                    className="bajas__chart-bar bajas__chart-bar--ingresos"
                    style={{ height: `${iH}%` }}
                    title={`${label}: ${m.ingresos} ingresos`}
                  >
                    {m.ingresos > 0 && <span className="bajas__chart-bar-value">{m.ingresos}</span>}
                  </div>
                </div>
                <div className="bajas__chart-x">
                  <span className="bajas__chart-x-label">{label}</span>
                  {m.soloInduccion > 0 && (
                    <span className="bajas__chart-x-solo" title={`${m.soloInduccion} solo inducción (no contabilizadas)`}>
                      · {m.soloInduccion} ind.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="bajas__grid">
        <section className="bajas__table-section" aria-label="Por puesto">
          <header className="bajas__section-head">
            <h2>Por puesto</h2>
            <span className="bajas__section-meta">
              {byPuesto.length} puesto{byPuesto.length === 1 ? '' : 's'} con movimiento
            </span>
          </header>
          {byPuesto.length === 0 ? (
            <div className="bajas__empty">
              <p>Sin movimiento para los filtros aplicados.</p>
            </div>
          ) : (
            <div className="bajas__table-wrapper">
              <table className="bajas__table">
                <thead>
                  <tr>
                    <th scope="col">Puesto</th>
                    <th scope="col">Área</th>
                    <th scope="col" className="text-center">Bajas</th>
                    <th scope="col" className="text-center">Ingresos</th>
                    <th scope="col" className="text-center">Cubiertas</th>
                    <th scope="col" className="text-center">Solo Ind.</th>
                  </tr>
                </thead>
                <tbody>
                  {byPuesto.map((row) => {
                    const pct =
                      row.bajas > 0 ? Math.round((row.cubiertas10d / row.bajas) * 100) : 0;
                    return (
                      <tr key={`${row.area}-${row.puesto}`}>
                        <td className="bajas__cell-puesto">{row.puesto}</td>
                        <td className="bajas__cell-area">{row.area}</td>
                        <td className="text-center">{row.bajas}</td>
                        <td className="text-center">{row.ingresos}</td>
                        <td className="text-center">
                          {row.bajas > 0 ? (
                            <span className="bajas__cobertura-pct" data-pct={pct}>
                              {row.cubiertas10d} ({pct}%)
                            </span>
                          ) : (
                            <span className="bajas__muted">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          {row.soloInduccion > 0 ? (
                            <Badge variant="default">{row.soloInduccion}</Badge>
                          ) : (
                            <span className="bajas__muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bajas__detail-section" aria-label="Detalle de bajas">
          <header className="bajas__section-head">
            <h2>Detalle de bajas {year}</h2>
            <span className="bajas__section-meta">
              {bajasConCobertura.length} registro{bajasConCobertura.length === 1 ? '' : 's'}
            </span>
          </header>
          {bajasConCobertura.length === 0 ? (
            <div className="bajas__empty">
              <p>
                {loading
                  ? 'Cargando bajas…'
                  : bajas.length === 0
                    ? 'Importa un JSON de bajas para empezar.'
                    : 'Sin bajas para los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <div className="bajas__table-wrapper">
              <table className="bajas__table bajas__table--compact">
                <thead>
                  <tr>
                    <th scope="col">Empleado</th>
                    <th scope="col">Fecha baja</th>
                    <th scope="col">Cobertura</th>
                    <th scope="col" aria-label="Ver detalle" />
                  </tr>
                </thead>
                <tbody>
                  {bajasConCobertura.map((b) => {
                    const rowClass = [
                      'bajas__row--clickable',
                      b.soloInduccion ? 'bajas__row--solo' : '',
                      !b.soloInduccion && b.cubiertaEn10d ? 'bajas__row--cubierta' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <tr
                        key={`${b.num_empleado}-${b.fecha_baja}`}
                        className={rowClass}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ver detalle de baja de ${b.nombre}`}
                        onClick={() => setDetalleTarget(b)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDetalleTarget(b);
                          }
                        }}
                      >
                        <td>
                          <div className="bajas__cell-emp">
                            <span className="bajas__cell-name">{b.nombre}</span>
                            <span className="bajas__cell-meta">
                              #{b.num_empleado} · {b.puesto}
                            </span>
                          </div>
                        </td>
                        <td>{formatShortDate(b.fecha_baja)}</td>
                        <td><BajaCoberturaBadge baja={b} /></td>
                        <td className="text-center bajas__cell-chevron">
                          <ChevronRight size={16} aria-hidden="true" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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

      <CubrirVacanteSheet
        isOpen={cubrirTarget !== null}
        baja={cubrirTarget}
        onClose={() => setCubrirTarget(null)}
        onSave={async (n, f, note) => marcarCubierta(n, f, note)}
        onClear={async (n) => desmarcarCubierta(n)}
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
  );
}
