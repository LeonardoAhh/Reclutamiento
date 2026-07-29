import { useEffect, useMemo, useState } from 'react';
import { getISOWeek } from 'date-fns';
import { motion } from 'framer-motion';

import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
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
  "Fecha Baja"?: string;
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
  
  // Month filter state (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
    
    let totalBajasMes = 0;
    let totalDiasPermanenciaMes = 0;
    let bajasCountMes = 0;
    let prevMonthTotalIngresos = 0;

    const prevMonthDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    const recruiterStats: Record<string, { totalIngresos: number; totalBajas: number; totalDiasPermanencia: number }> = {};
    
    // Lista para mostrar el detalle de las personas inhabilitadas
    const bajasList: { nombre: string; reclutador: string; fechaIngreso: string; fechaBaja: string; dias: number }[] = [];

    data.forEach(record => {
      const date = record["Fecha Ingreso"] || 'Sin Fecha';
      const parsed = parseDate(date);
      
      const isCurrentMonth = parsed.getMonth() === selectedMonth.getMonth() && parsed.getFullYear() === selectedMonth.getFullYear();
      const isPrevMonth = parsed.getMonth() === prevMonthDate.getMonth() && parsed.getFullYear() === prevMonthDate.getFullYear();

      if (!isCurrentMonth && !isPrevMonth) {
        return;
      }

      if (isPrevMonth) {
        prevMonthTotalIngresos += 1;
        return;
      }

      let rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
      let recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];

      if (recruiter !== 'Sin Reclutador') {
        recruiter = recruiter.charAt(0).toUpperCase() + recruiter.slice(1).toLowerCase();
        if (recruiter === 'Nayeli') {
          recruiter = 'Alexandra';
        }
      }

      recruiterSet.add(recruiter);

      if (!groupedByDate[date]) groupedByDate[date] = {};
      if (!groupedByDate[date][recruiter]) groupedByDate[date][recruiter] = 0;
      groupedByDate[date][recruiter] += 1;
      
      if (!recruiterStats[recruiter]) {
        recruiterStats[recruiter] = { totalIngresos: 0, totalBajas: 0, totalDiasPermanencia: 0 };
      }
      recruiterStats[recruiter].totalIngresos += 1;

      const rawFechaBaja = record["Fecha Baja"]?.trim();
      if (rawFechaBaja && rawFechaBaja !== '-' && rawFechaBaja.toLowerCase() !== 'sin fecha') {
        const fechaBaja = parseDate(rawFechaBaja);
        if (!isNaN(fechaBaja.getTime()) && !isNaN(parsed.getTime())) {
          const msDiff = fechaBaja.getTime() - parsed.getTime();
          const diasPermanencia = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
          
          recruiterStats[recruiter].totalBajas += 1;
          recruiterStats[recruiter].totalDiasPermanencia += diasPermanencia;
          
          totalBajasMes += 1;
          totalDiasPermanenciaMes += diasPermanencia;
          bajasCountMes += 1;
          
          bajasList.push({
            nombre: record["Nombre"] || 'Sin Nombre',
            reclutador: recruiter,
            fechaIngreso: date,
            fechaBaja: rawFechaBaja,
            dias: diasPermanencia
          });
        }
      }
    });

    const recruiterList = Array.from(recruiterSet).sort();

    const formattedData = Object.entries(groupedByDate).map(([date, counts]) => {
      let total = 0;
      recruiterList.forEach(rec => { total += counts[rec] || 0; });
      return { date, parsedDate: parseDate(date), total, ...counts } as any;
    });

    formattedData.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const isBeforeJune2026 = selectedMonth.getFullYear() < 2026 || (selectedMonth.getFullYear() === 2026 && selectedMonth.getMonth() < 5);
    const metaMensual = isBeforeJune2026 ? 13 : 28;
    const metaSemanal = isBeforeJune2026 ? null : 7;

    const totalIngresos = formattedData.reduce((acc, row) => acc + row.total, 0);
    const promedio = formattedData.length ? Math.round((totalIngresos / formattedData.length) * 10) / 10 : 0;
    const recruiterTotals = recruiterList.map(rec => ({
      name: rec,
      total: formattedData.reduce((acc, row) => acc + (row[rec] || 0), 0),
      tone: getRecruiterTone(recruiterList.indexOf(rec))
    }));
    const topRecruiter = recruiterTotals.length ? recruiterTotals.reduce((a, b) => a.total > b.total ? a : b) : null;
    const reclutadoresEnMeta = recruiterTotals.filter(r => r.total >= metaMensual).length;
    const promedioPermanenciaGlobal = bajasCountMes > 0 ? Math.round(totalDiasPermanenciaMes / bajasCountMes) : 0;

    const groupedByWeek: Record<string, any> = {};
    formattedData.forEach(row => {
      if (row.date === 'Sin Fecha') return; // opcional: si quieres agrupar "Sin Fecha" como "Semana NaN", mejor omitir o manejar.
      const weekNum = getISOWeek(row.parsedDate);
      const weekKey = `Semana ${weekNum}`;
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = { date: weekKey, parsedDate: row.parsedDate, total: 0 };
      }
      groupedByWeek[weekKey].total += row.total;
      recruiterList.forEach(rec => {
        if (!groupedByWeek[weekKey][rec]) groupedByWeek[weekKey][rec] = 0;
        groupedByWeek[weekKey][rec] += (row[rec] || 0);
      });
    });
    const tableDataByWeek = Object.values(groupedByWeek).sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime());

    return {
      chartData: formattedData,
      recruiters: recruiterList,
      tableData: tableDataByWeek,
      kpi: { 
        totalIngresos, 
        promedio, 
        topRecruiter, 
        reclutadoresEnMeta, 
        recruiterTotals,
        totalBajasMes,
        promedioPermanenciaGlobal,
        recruiterStats,
        prevMonthTotalIngresos,
        bajasList,
        metaMensual,
        metaSemanal
      }
    };
  }, [data, selectedMonth]);

  const historicalGoals = useMemo(() => {
    const statsByMonthRecruiter: Record<string, Record<string, number>> = {};
    const recruiterSet = new Set<string>();
    
    data.forEach(record => {
      const dateStr = record["Fecha Ingreso"];
      if (!dateStr) return;
      const parsed = parseDate(dateStr);
      if (isNaN(parsed.getTime())) return;
      
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const monthKey = `${year}-${month}`;
      
      let rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
      let recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];
      
      if (recruiter !== 'Sin Reclutador') {
        recruiter = recruiter.charAt(0).toUpperCase() + recruiter.slice(1).toLowerCase();
        if (recruiter === 'Nayeli') {
          recruiter = 'Alexandra';
        }
      }
      if (recruiter === 'Sin Reclutador') return;
      
      recruiterSet.add(recruiter);
      
      if (!statsByMonthRecruiter[monthKey]) statsByMonthRecruiter[monthKey] = {};
      if (!statsByMonthRecruiter[monthKey][recruiter]) statsByMonthRecruiter[monthKey][recruiter] = 0;
      
      statsByMonthRecruiter[monthKey][recruiter] += 1;
    });
    
    const recruiterMonthsCompleted: Record<string, { total: number, details: { monthName: string, meta: number, count: number }[] }> = {};
    Array.from(recruiterSet).forEach(rec => recruiterMonthsCompleted[rec] = { total: 0, details: [] });
    
    const sortedMonths = Object.entries(statsByMonthRecruiter).sort((a, b) => {
      const [yearA, monthA] = a[0].split('-').map(Number);
      const [yearB, monthB] = b[0].split('-').map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    sortedMonths.forEach(([monthKey, recruiters]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      
      const isBeforeJune2026 = y < 2026 || (y === 2026 && m < 5);
      const meta = isBeforeJune2026 ? 13 : 28;
      const monthName = `${monthNames[m]} ${y}`;
      
      Object.entries(recruiters).forEach(([rec, count]) => {
         if (count >= meta) {
             recruiterMonthsCompleted[rec].total += 1;
             recruiterMonthsCompleted[rec].details.push({ monthName, meta, count });
         }
      });
    });
    
    const recruiterList = Array.from(recruiterSet).sort();
    return recruiterList.map((name, index) => ({
      name,
      tone: getRecruiterTone(index),
      monthsCompleted: recruiterMonthsCompleted[name].total,
      details: recruiterMonthsCompleted[name].details
    })).sort((a, b) => b.monthsCompleted - a.monthsCompleted);
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

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  };

  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(selectedMonth);

  return (
    <section className="indicadores-view config-page__content" aria-label="Indicadores de Reclutamiento">
      <header className="config-page__header">
        <h2 className="config-page__title">Ingresos por Reclutador</h2>
      </header>



      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {kpi && (
        <div className="indicadores-kpi-grid" role="region" aria-label="Resumen de indicadores">
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Total Ingresos</span>
            <span className="indicadores-kpi-value">
              {kpi.totalIngresos}
              {kpi.prevMonthTotalIngresos > 0 && (
                <span 
                  className={`type-caption-sm font-bold ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? 'text-success' : 'text-error'}`}
                  style={{ marginLeft: 'var(--spacing-sm)' }}
                  title={`Mes anterior: ${kpi.prevMonthTotalIngresos} ingresos`}
                >
                  {kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? '↑ +' : '↓ -'} 
                  {Math.abs(kpi.totalIngresos - kpi.prevMonthTotalIngresos)}
                </span>
              )}
            </span>
            <span className="indicadores-kpi-sub">{tableData.length} semanas registradas</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Promedio Semanal</span>
            <span className="indicadores-kpi-value">{kpi.promedio}</span>
            <span className="indicadores-kpi-sub">Ingresos por semana</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Top Reclutador</span>
            <span className="indicadores-kpi-value indicadores-kpi-value--name">
              {kpi.topRecruiter?.name}
            </span>
            <span className="indicadores-kpi-sub">{kpi.topRecruiter?.total} ingresos</span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Meta Mensual</span>
            <span className="indicadores-kpi-value">
              {kpi.reclutadoresEnMeta}
              <span className="type-caption-sm text-muted font-normal" style={{ marginLeft: 'var(--spacing-xs)' }}>/ {kpi.recruiterTotals.length}</span>
            </span>
            <span className="indicadores-kpi-sub">Reclutadores con ≥ {kpi.metaMensual} ingresos</span>
          </div>
        </div>
      )}

      {/* ── Historial de Metas ──────────────────────────────────── */}
      {historicalGoals && historicalGoals.length > 0 && (
        <div className="indicadores-historical-grid" role="region" aria-label="Historial de metas logradas">
          <div className="indicadores-historical-list">
            {historicalGoals.map(rec => (
              <Tooltip
                key={rec.name}
                content={
                  <div className="trend-tooltip">
                    <div className="trend-tooltip__section">
                      <strong className="trend-tooltip__title trend-tooltip__title--success">
                        Meses logrados ({rec.details.length}):
                      </strong>
                      <ul className="trend-tooltip__list">
                        {rec.details.map(d => (
                          <li key={d.monthName}>
                            {d.monthName}: {d.count} / {d.meta}
                          </li>
                        ))}
                      </ul>
                      {rec.details.length === 0 && (
                        <ul className="trend-tooltip__list">
                          <li>Aún no ha logrado la meta.</li>
                        </ul>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="indicadores-historical-card">
                  <span className={`indicadores-recruiter-dot ${rec.tone}`} aria-hidden="true" />
                  <span className="indicadores-historical-card__name">{rec.name}</span>
                  <span className="indicadores-historical-card__value">{rec.monthsCompleted} {rec.monthsCompleted === 1 ? 'mes' : 'meses'}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}


      {/* ── Tabla transpuesta: Reclutadores × Semanas ────────────── */}
      <div className="indicadores-card indicadores-table-card">
        <div className="indicadores-table-header">
          <h3 className="type-heading-sm text-ink m-0">Desglose Detallado</h3>
          
          <div className="indicadores-month-nav">
            <button 
              className="btn-icon"
              onClick={handlePrevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="indicadores-month-nav__label type-body-md text-ink font-medium capitalize">
              {monthLabel}
            </span>
            <button 
              className="btn-icon"
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="table-responsive indicadores-desktop-only">
          <table className="indicadores-table" aria-label="Desglose de ingresos por reclutador y semana">
            <caption className="sr-only">Desglose detallado de ingresos por reclutador y semana</caption>
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
                    let valClass = "";
                    if (val) {
                      if (kpi && kpi.metaSemanal !== null) {
                        valClass = val >= kpi.metaSemanal ? "text-success" : "text-warning";
                      } else {
                        valClass = "text-ink";
                      }
                    }
                    
                    return (
                      <td key={row.date}>
                        {val ? (
                          <span className={`indicador-value font-bold ${valClass}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-muted-soft">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-right font-bold">
                    {(() => {
                      const totalRecruiter = kpi?.recruiterTotals[index]?.total ?? 0;
                      let classColor = "text-warning";
                      if (kpi && totalRecruiter >= kpi.metaMensual) {
                        classColor = "text-success";
                      }
                      return (
                        <span className={`indicador-value indicador-value--total ${classColor}`}>
                          {totalRecruiter}
                        </span>
                      );
                    })()}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
            {tableData.length > 0 && (
              <tfoot>
                <tr>
                  <th scope="row">Total por Semana</th>
                  {tableData.map(row => {
                    let totalClass = "text-warning";
                    if (kpi?.metaSemanal !== null) {
                      const teamGoal = kpi!.metaSemanal * recruiters.length;
                      if (row.total >= teamGoal) {
                        totalClass = "text-success";
                      }
                    } else {
                      totalClass = "text-body";
                    }
                    
                    return (
                      <td key={row.date} className="font-bold">
                        <span className={`indicador-value ${totalClass}`}>{row.total}</span>
                      </td>
                    );
                  })}
                  <td className="text-right font-bold type-heading-sm">
                    {(() => {
                      const totalGeneral = kpi?.totalIngresos ?? 0;
                      let classColor = "text-warning";
                      if (kpi) {
                        const teamMonthlyGoal = kpi.metaMensual * recruiters.length;
                        if (totalGeneral >= teamMonthlyGoal) {
                          classColor = "text-success";
                        }
                      }
                      return (
                        <span className={classColor}>
                          {totalGeneral}
                        </span>
                      );
                    })()}
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
                  let valClass = "text-warning";
                  if (kpi?.metaSemanal !== null) {
                    if (val && val >= kpi!.metaSemanal) {
                      valClass = "text-success";
                    }
                  } else {
                    valClass = "text-body";
                  }

                  return (
                    <li key={row.date} className="indicadores-mobile-detail__item">
                      <span className="type-body-sm font-medium">{row.date}</span>
                      <span className="type-body-sm text-ink font-bold">
                        {val ? (
                          <span className={valClass}>
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

      {/* ── Sección de Retención y Efectividad ──────────────────── */}
      <header className="config-page__header" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2 className="config-page__title">Efectividad y Retención</h2>
      </header>

      {kpi && (
        <>
          <div className="indicadores-kpi-grid" role="region" aria-label="Resumen de bajas">
            <div className="indicadores-kpi-card">
              <span className="indicadores-kpi-label">Total Bajas</span>
              <span className="indicadores-kpi-value text-error">
                {kpi.totalBajasMes}
              </span>
              <span className="indicadores-kpi-sub">Personal inactivo</span>
            </div>
            <div className="indicadores-kpi-card">
              <span className="indicadores-kpi-label">Promedio Permanencia</span>
              <span className="indicadores-kpi-value">
                {kpi.promedioPermanenciaGlobal}
              </span>
              <span className="indicadores-kpi-sub">Días antes de baja</span>
            </div>
          </div>

          <div className="indicadores-card indicadores-table-card">
            <div className="indicadores-table-header">
              <h3 className="type-heading-sm text-ink m-0">Desempeño por Reclutador</h3>
            </div>
            <div className="table-responsive indicadores-desktop-only">
              <table className="indicadores-table" aria-label="Efectividad por reclutador">
                <caption className="sr-only">Resumen de retención por reclutador</caption>
                <thead>
                  <tr>
                    <th scope="col" className="indicadores-table-sticky">Reclutador</th>
                    <th scope="col" className="text-right">Ingresos</th>
                    <th scope="col" className="text-right">Bajas</th>
                    <th scope="col" className="text-right">Retención (%)</th>
                    <th scope="col" className="text-right">Prom. Días</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiters.map((recruiter, index) => {
                    const stats = kpi.recruiterStats[recruiter];
                    if (!stats) return null;
                    const retention = stats.totalIngresos > 0 
                      ? Math.round(((stats.totalIngresos - stats.totalBajas) / stats.totalIngresos) * 100) 
                      : 100;
                    const avgDays = stats.totalBajas > 0 
                      ? Math.round(stats.totalDiasPermanencia / stats.totalBajas) 
                      : '-';

                    return (
                      <tr key={`retention-${recruiter}`}>
                        <th scope="row" className="indicadores-table-row-header">
                          <span
                            className={`indicadores-recruiter-dot ${getRecruiterTone(index)}`}
                            aria-hidden="true"
                          />
                          {recruiter}
                        </th>
                        <td className="text-right font-medium">{stats.totalIngresos}</td>
                        <td className="text-right font-bold text-error">{stats.totalBajas > 0 ? stats.totalBajas : '-'}</td>
                        <td className="text-right">
                          <span className={`indicador-value ${retention >= 70 ? 'text-success' : 'text-warning'}`}>
                            {retention}%
                          </span>
                        </td>
                        <td className="text-right text-muted">{avgDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* ── Mobile View for Retention ── */}
            <div className="indicadores-mobile-only">
              <ul className="indicadores-mobile-list" aria-label="Retención por reclutador">
                {recruiters.map((recruiter, index) => {
                  const stats = kpi.recruiterStats[recruiter];
                  if (!stats) return null;
                  const retention = stats.totalIngresos > 0 
                    ? Math.round(((stats.totalIngresos - stats.totalBajas) / stats.totalIngresos) * 100) 
                    : 100;
                  const avgDays = stats.totalBajas > 0 
                    ? Math.round(stats.totalDiasPermanencia / stats.totalBajas) 
                    : '-';

                  return (
                    <li key={`retention-mob-${recruiter}`}>
                      <div className="indicadores-mobile-list__btn" style={{ cursor: 'default' }}>
                        <div className="indicadores-mobile-list__info">
                          <span
                            className={`indicadores-recruiter-dot ${getRecruiterTone(index)}`}
                            aria-hidden="true"
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            <span className="type-body-sm font-medium text-ink">{recruiter}</span>
                            <span className="type-caption-sm text-muted">Ingresos: {stats.totalIngresos} &nbsp;|&nbsp; Bajas: <span className="text-error font-medium">{stats.totalBajas}</span></span>
                          </div>
                        </div>
                        <div className="indicadores-mobile-list__right" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing-xs)' }}>
                          <span className={`type-body-sm font-bold ${retention >= 70 ? 'text-success' : 'text-warning'}`}>
                            {retention}%
                          </span>
                          <span className="type-caption-sm text-muted">
                            Prom. {avgDays}d
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {kpi.bajasList.length > 0 && (
            <div className="indicadores-card indicadores-table-card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <div className="indicadores-table-header">
                <h3 className="type-heading-sm text-ink m-0">Detalle de Personal Inactivo</h3>
              </div>
              <div className="indicadores-bajas-grid">
                {recruiters.map(recruiter => {
                  const bajasOfRecruiter = kpi.bajasList.filter(b => b.reclutador === recruiter);
                  if (bajasOfRecruiter.length === 0) return null;
                  
                  return (
                    <div key={`bajas-col-${recruiter}`} className="indicadores-bajas-col">
                      <h4 className="indicadores-bajas-header type-body-sm font-bold uppercase">{recruiter}</h4>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {bajasOfRecruiter.map((baja, i) => (
                          <li key={`baja-detail-${i}`} style={{ borderBottom: '1px solid var(--color-hairline)', padding: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="type-body-sm font-medium text-ink">{baja.nombre}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xs)' }}>
                                <span className="type-caption-sm text-muted">
                                  <strong>Ingreso:</strong> {baja.fechaIngreso}
                                </span>
                                <span className="type-caption-sm text-error font-medium">
                                  <strong>Baja:</strong> {baja.fechaBaja} ({baja.dias} días)
                                </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
