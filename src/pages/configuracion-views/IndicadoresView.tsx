import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, Users, Target, Calendar, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

const RECRUITER_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-muted)',
  'var(--color-charcoal)',
  'var(--color-muted-soft)',
];

const KPI_ICONS = [TrendingUp, Users, Target, Calendar];

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
  const { user } = useAuth();
  const [data, setData] = useState<IndicadorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
      return { chartData: [], recruiters: [], tableData: [], kpi: null };
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
      color: RECRUITER_COLORS[recruiterList.indexOf(rec) % RECRUITER_COLORS.length]
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
    <section className="indicadores-view" aria-label="Indicadores de Reclutamiento">
      <header className="config-page__header">
        <h2 className="type-heading-md text-ink">Ingresos por Reclutador</h2>
        <p className="type-body-sm text-muted">Resumen de contrataciones semanales y desempeño del equipo.</p>
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
            <span className="indicadores-kpi-value" style={{ fontSize: 'var(--type-heading-md-size)' }}>
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
        <div className="table-responsive">
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
                      className="indicadores-recruiter-dot"
                      style={{ backgroundColor: RECRUITER_COLORS[index % RECRUITER_COLORS.length] }}
                      aria-hidden="true"
                    />
                    {recruiter}
                  </th>
                  {tableData.map(row => {
                    const val = row[recruiter];
                    return (
                      <td key={row.date}>
                        {val ? (
                          <span
                            className="indicador-value"
                            style={{ color: RECRUITER_COLORS[index % RECRUITER_COLORS.length] }}
                          >
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
      </div>
    </section>
  );
}
