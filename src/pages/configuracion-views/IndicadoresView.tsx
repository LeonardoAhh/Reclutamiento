import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { Skeleton } from '@/components/ui/Skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IndicadorRecord {
  "No.": string;
  "Nombre": string;
  "Puesto": string;
  "Turno": string;
  "Fecha Ingreso": string;
  "Ruta": string;
  "Parada": string;
  "Ubicacion": string;
  "Fuente de Reclutamiento": string;
  "Reclutador": string;
}

const RECRUITER_TONES = 5;

function getRecruiterTone(index: number) {
  return `data-tone-${index % RECRUITER_TONES}`;
}

function parseDate(dateStr: string) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  return new Date(dateStr);
}

export function IndicadoresView() {
  const [data, setData] = useState<IndicadorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedMobileRecruiter, setSelectedMobileRecruiter] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetch('/indicador.json')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar indicador.json');
        return res.json();
      })
      .then((json: IndicadorRecord[]) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('No se pudieron cargar los datos de indicadores.');
        setLoading(false);
      });
  }, []);

  const { chartData, recruiters, tableData, kpi } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [] as any[], recruiters: [] as string[], tableData: [] as any[], kpi: null };
    }

    const groupedByDate: Record<string, Record<string, number>> = {};
    const recruiterSet = new Set<string>();

    data.forEach(record => {
      const date = record["Fecha Ingreso"] || 'Sin Fecha';
      let rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
      const recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];

      recruiterSet.add(recruiter);

      if (!groupedByDate[date]) groupedByDate[date] = {};
      if (!groupedByDate[date][recruiter]) groupedByDate[date][recruiter] = 0;
      groupedByDate[date][recruiter] += 1;
    });

    const recruiterList = Array.from(recruiterSet).sort();

    const formattedData = Object.entries(groupedByDate).map(([date, counts]) => {
      let total = 0;
      recruiterList.forEach(rec => { total += counts[rec] || 0; });
      return { date, parsedDate: parseDate(date), total, ...counts } as any;
    });

    formattedData.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const totalIngresos = formattedData.reduce((acc, row) => acc + row.total, 0);
    const promedio = formattedData.length ? Math.round((totalIngresos / formattedData.length) * 10) / 10 : 0;
    const recruiterTotals = recruiterList.map(rec => ({
      name: rec,
      total: formattedData.reduce((acc, row) => acc + (row[rec] || 0), 0),
      tone: getRecruiterTone(recruiterList.indexOf(rec))
    }));
    const topRecruiter = recruiterTotals.length ? recruiterTotals.reduce((a, b) => a.total > b.total ? a : b) : null;
    const diasObjetivo = formattedData.filter(row => row.total >= 7).length;

    return {
      chartData: formattedData,
      recruiters: recruiterList,
      tableData: formattedData,
      kpi: { totalIngresos, promedio, topRecruiter, diasObjetivo, recruiterTotals }
    };
  }, [data]);

  const selectedRecruiterIndex = selectedMobileRecruiter
    ? recruiters.indexOf(selectedMobileRecruiter)
    : -1;

  if (loading) {
    return (
      <section className="indicadores-view">
        <header className="config-page__header">
          <Skeleton variant="text" width="200px" height="28px" />
          <Skeleton variant="text" width="60%" height="20px" className="mt-sm" />
        </header>
        <div className="indicadores-kpi-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="indicadores-kpi-card">
              <Skeleton variant="text" width="80px" height="14px" />
              <Skeleton variant="text" width="60px" height="32px" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="config-empty">
        <p className="text-error type-body-md">{error}</p>
      </div>
    );
  }

  return (
    <section className="indicadores-view config-page__content" aria-label="Indicadores de Reclutamiento">
      <header className="config-page__header">
        <h2 className="config-page__title">Ingresos por Reclutador</h2>
        <p className="config-page__subtitle">Resumen de contrataciones semanales y desempeño del equipo.</p>
      </header>



      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {kpi && (
        <div className="indicadores-kpi-grid" role="region" aria-label="Resumen de indicadores">
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Total Ingresos</span>
            <span className="indicadores-kpi-value">{kpi.totalIngresos}</span>
            <span className="indicadores-kpi-sub">{tableData.length} fechas registradas</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Promedio Semanal</span>
            <span className="indicadores-kpi-value">{kpi.promedio}</span>
            <span className="indicadores-kpi-sub">Ingresos por fecha</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Top Reclutador</span>
            <span className="indicadores-kpi-value indicadores-kpi-value--name">
              {kpi.topRecruiter?.name}
            </span>
            <span className="indicadores-kpi-sub">{kpi.topRecruiter?.total} ingresos</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Días Objetivo</span>
            <span className="indicadores-kpi-value">{kpi.diasObjetivo}</span>
            <span className="indicadores-kpi-sub">Meta: 7 ingresos</span>
          </div>
        </div>
      )}


      {/* ── Tabla transpuesta: Reclutadores × Fechas ────────────── */}
      <div className="indicadores-card indicadores-table-card">
        <div className="indicadores-table-header">
          <h3 className="type-heading-sm text-ink m-0">Desglose Detallado</h3>
          <p className="type-caption-sm text-muted m-0">Reclutadores en filas, fechas en columnas</p>
        </div>
        <div className="table-responsive indicadores-desktop-only">
          <table className="indicadores-table" aria-label="Desglose de ingresos por reclutador y fecha">
            <caption className="sr-only">Desglose detallado de ingresos por reclutador y fecha</caption>
            <thead>
              <tr>
                <th scope="col" className="indicadores-table-sticky">Reclutador</th>
                {tableData.map(row => (
                  <th scope="col" key={row.date}>{row.date}</th>
                ))}
                <th scope="col" className="text-right">Total</th>
              </tr>
            </thead>
            <motion.tbody
              initial={prefersReducedMotion ? false : "hidden"}
              animate={prefersReducedMotion ? false : "visible"}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
              }}
            >
              {recruiters.map((recruiter, index) => (
                <motion.tr
                  key={recruiter}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'var(--color-surface-soft)' }}
                  transition={{ duration: 0.2 }}
                >
                  <th scope="row" className="indicadores-table-row-header">
                    <span
                      className={`indicadores-recruiter-dot ${getRecruiterTone(index)}`}
                      aria-hidden="true"
                    />
                    {recruiter}
                  </th>
                  {tableData.map(row => {
                    const val = row[recruiter];
                    return (
                      <td key={row.date}>
                        {val ? (
                          <span className={`indicador-value ${getRecruiterTone(index)}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-muted-soft">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-right font-bold text-ink">
                    <span className="indicador-value indicador-value--total">
                      {kpi?.recruiterTotals[index]?.total ?? 0}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
            {tableData.length > 0 && (
              <tfoot>
                <tr>
                  <th scope="row">Total por Fecha</th>
                  {tableData.map(row => (
                    <td key={row.date} className="font-bold">
                      <span className="indicador-value">{row.total}</span>
                    </td>
                  ))}
                  <td className="text-right font-bold text-primary type-heading-sm">
                    {kpi?.totalIngresos ?? 0}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Mobile Drill-down ── */}
        <div className="indicadores-mobile-only">
          {selectedMobileRecruiter ? (
            <div className="indicadores-mobile-detail" aria-live="polite">
              <button
                type="button"
                className="config-mobile-back"
                onClick={() => setSelectedMobileRecruiter(null)}
                aria-label="Volver a la lista de reclutadores"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Volver
              </button>
              
              <div className="indicadores-mobile-detail__header">
                <span
                  className={`indicadores-recruiter-dot ${getRecruiterTone(selectedRecruiterIndex)}`}
                  aria-hidden="true"
                />
                <h4 className="type-heading-md m-0">{selectedMobileRecruiter}</h4>
              </div>
              
              <ul className="indicadores-mobile-detail__list">
                {tableData.map(row => {
                  const val = row[selectedMobileRecruiter];
                  return (
                    <li key={row.date} className="indicadores-mobile-detail__item">
                      <span className="type-body-sm font-medium">{row.date}</span>
                      <span className="type-body-sm text-ink font-bold">
                        {val ? (
                          <span className={`indicadores-tone-value ${getRecruiterTone(selectedRecruiterIndex)}`}>
                            {val} ingresos
                          </span>
                        ) : (
                          <span className="text-muted-soft">-</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              
              <div className="indicadores-mobile-detail__total">
                <span className="type-body-sm font-bold">Total</span>
                <span className="type-heading-sm text-primary">
                  {kpi?.recruiterTotals[recruiters.indexOf(selectedMobileRecruiter)]?.total ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <ul className="indicadores-mobile-list" aria-label="Lista de reclutadores">
              {recruiters.map((recruiter, index) => (
                <li key={recruiter}>
                  <button
                    type="button"
                    className="indicadores-mobile-list__btn"
                    onClick={() => setSelectedMobileRecruiter(recruiter)}
                  >
                    <div className="indicadores-mobile-list__info">
                      <span
                        className={`indicadores-recruiter-dot ${getRecruiterTone(index)}`}
                        aria-hidden="true"
                      />
                      <span className="type-body-sm font-medium text-ink">{recruiter}</span>
                    </div>
                    <div className="indicadores-mobile-list__right">
                      <span className="type-caption-sm text-muted">
                        {kpi?.recruiterTotals[index]?.total ?? 0} ingresos
                      </span>
                      <ChevronRight size={16} className="text-muted-soft" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
