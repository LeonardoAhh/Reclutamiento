import { useMemo, useState } from 'react';
import {
  Users,
  UserMinus,
  UserPlus,
  ShieldCheck,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { BajasImporter } from '@/components/ui/BajasImporter';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useBajas } from '@/hooks/useBajas';
import { computeMonthlyComparison } from '@/lib/bajas';
import { formatMonthLabel, formatShortDate } from '@/lib/dates';
import './Bajas.css';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function Bajas() {
  const { employees } = useSupabaseData();
  const { bajas, loading, importBajas } = useBajas();

  const [year, setYear] = useState<number>(currentYear);
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [puestoFilter, setPuestoFilter] = useState<string>('');

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.area);
    for (const b of bajas) set.add(b.area);
    return Array.from(set).sort();
  }, [employees, bajas]);

  const puestosForArea = useMemo(() => {
    const set = new Set<string>();
    const matches = (a: string) => !areaFilter || a === areaFilter;
    for (const e of employees) if (matches(e.area)) set.add(e.puesto);
    for (const b of bajas) if (matches(b.area)) set.add(b.puesto);
    return Array.from(set).sort();
  }, [employees, bajas, areaFilter]);

  const comparison = useMemo(
    () =>
      computeMonthlyComparison(bajas, employees, year, {
        area: areaFilter || undefined,
        puesto: puestoFilter || undefined,
      }),
    [bajas, employees, year, areaFilter, puestoFilter]
  );

  const { months, byPuesto, bajasConCobertura, totals } = comparison;

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
    <main className="bajas container" id="page-bajas">
      <section className="bajas__hero">
        <div>
          <h1 className="bajas__title">Ingresos vs Bajas</h1>
          <p className="bajas__subtitle">
            Comparativa mes a mes. Las bajas con <strong>“Solo Inducción”</strong> se
            muestran pero no se contabilizan en totales ni cobertura.
          </p>
        </div>
        <div className="bajas__hero-actions">
          <BajasImporter onImport={importBajas} />
        </div>
      </section>

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

      <section className="bajas__kpis" aria-label="KPIs">
        <StatCard
          id="kpi-bajas"
          label="Bajas"
          value={totals.bajas}
          icon={<UserMinus size={20} aria-hidden="true" />}
          accentColor="var(--color-error)"
        />
        <StatCard
          id="kpi-ingresos"
          label="Ingresos"
          value={totals.ingresos}
          icon={<UserPlus size={20} aria-hidden="true" />}
          accentColor="var(--color-success)"
        />
        <StatCard
          id="kpi-cobertura"
          label="Cobertura ≤10 días"
          value={`${totals.coverturaPct}%`}
          icon={<ShieldCheck size={20} aria-hidden="true" />}
          subtitle={`${totals.cubiertas10d}/${totals.bajas} bajas cubiertas`}
          accentColor="var(--color-accent-teal)"
        />
        <StatCard
          id="kpi-solo-induccion"
          label="Solo Inducción"
          value={totals.soloInduccion}
          icon={<Users size={20} aria-hidden="true" />}
          subtitle="No contabilizadas"
          accentColor="var(--color-muted)"
        />
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
                  <th scope="col" className="text-center">Cubiertas ≤10d</th>
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
            <table className="bajas__table">
              <thead>
                <tr>
                  <th scope="col">Empleado</th>
                  <th scope="col">Puesto</th>
                  <th scope="col">Área · Sección</th>
                  <th scope="col">Fecha baja</th>
                  <th scope="col">Tipo / Motivo</th>
                  <th scope="col" className="text-center">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {bajasConCobertura.map((b) => {
                  const rowClass = [
                    b.soloInduccion ? 'bajas__row--solo' : '',
                    !b.soloInduccion && b.cubiertaEn10d ? 'bajas__row--cubierta' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <tr key={`${b.num_empleado}-${b.fecha_baja}`} className={rowClass}>
                      <td>
                        <div className="bajas__cell-emp">
                          <span className="bajas__cell-name">{b.nombre}</span>
                          <span className="bajas__cell-meta">#{b.num_empleado}</span>
                        </div>
                      </td>
                      <td>{b.puesto}</td>
                      <td>
                        <span className="bajas__cell-meta">
                          {b.area} · {b.seccion}
                        </span>
                      </td>
                      <td>{formatShortDate(b.fecha_baja)}</td>
                      <td>
                        <div className="bajas__cell-motivo">
                          <span>{b.tipo_baja || '—'}</span>
                          <span className="bajas__cell-meta">{b.motivo_baja || '—'}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        {b.soloInduccion ? (
                          <Badge variant="default">
                            <AlertCircle size={11} aria-hidden="true" /> Solo Inducción
                          </Badge>
                        ) : b.cubiertaEn10d ? (
                          <Badge variant="success">
                            ≤10d · {b.coberturaDias}d
                          </Badge>
                        ) : b.coberturaDias !== null ? (
                          <Badge variant="amber">{b.coberturaDias}d</Badge>
                        ) : (
                          <Badge variant="error">No cubierta</Badge>
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
    </main>
  );
}
