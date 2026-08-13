import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';


import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { ChevronLeft, ChevronRight, Database, Loader2 } from 'lucide-react';
import { useIndicadoresStats, getRecruiterTone } from '@/hooks/useIndicadoresStats';
import { supabase } from '@/lib/supabase';
import { sileo } from '@/lib/notify';

export function IndicadoresView() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [selectedMobileRecruiter, setSelectedMobileRecruiter] = useState<string | null>(null);
  
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

  const { chartData, recruiters, tableData, kpi, historicalGoals, loading, error } = useIndicadoresStats(selectedMonth);

  const selectedRecruiterIndex = selectedMobileRecruiter
    ? recruiters.indexOf(selectedMobileRecruiter)
    : -1;

  if (loading) {
    return (
      <section className="indicadores-view config-page">
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
    <section className="indicadores-view config-page" aria-label="Indicadores de Reclutamiento">

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {kpi && (
        <div className="indicadores-kpi-grid" role="region" aria-label="Resumen de indicadores">
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Total Ingresos</span>
            <span className="indicadores-kpi-value">
              {kpi.totalIngresos}
              {kpi.prevMonthTotalIngresos > 0 && (
                <span 
                  className={`type-caption-sm font-bold indicadores-section__title-icon ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? 'text-success' : 'text-error'}`}
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
              {kpi.topRecruiters.length > 1
                ? 'Empate'
                : kpi.topRecruiters[0]?.name}
            </span>
            <span className="indicadores-kpi-sub">
              {kpi.topRecruiters.length > 1
                ? `${kpi.topRecruiters.map((recruiter) => recruiter.name).join(' y ')} · ${kpi.topRecruiters[0]?.total} ingresos cada una`
                : `${kpi.topRecruiters[0]?.total ?? 0} ingresos`}
            </span>
          </div>
          <div className="indicadores-kpi-card">
            <span className="indicadores-kpi-label">Meta Mensual</span>
            <span className="indicadores-kpi-value">
              {kpi.reclutadoresEnMeta}
              <span className="type-caption-sm text-muted font-normal indicadores-kpi-total-suffix">/ {kpi.recruiterTotals.length}</span>
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
                      <div className="indicadores-mobile-list__btn indicadores-mobile-list__row">
                        <div className="indicadores-mobile-list__info">
                          <span
                            className={`indicadores-recruiter-dot ${getRecruiterTone(index)}`}
                            aria-hidden="true"
                          />
                          <div className="indicadores-bajas-col">
                            <span className="type-body-sm font-medium text-ink">{recruiter}</span>
                            <span className="type-caption-sm text-muted">Ingresos: {stats.totalIngresos} &nbsp;|&nbsp; Bajas: <span className="text-error font-medium">{stats.totalBajas}</span></span>
                          </div>
                        </div>
                        <div className="indicadores-mobile-list__right indicadores-bajas-col">
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
            <div className="indicadores-card indicadores-table-card indicadores-bajas-section">
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
                      <ul className="indicadores-bajas-list">
                        {bajasOfRecruiter.map((baja, i) => (
                          <li key={`baja-detail-${i}`} className="indicadores-bajas-item">
                            <div className="indicadores-bajas-item-header">
                                <span className="type-body-sm font-medium text-ink">{baja.nombre}</span>
                                {baja.numEmpleado && (
                                  <span className="type-caption-sm text-muted">#{baja.numEmpleado}</span>
                                )}
                            </div>
                            <div className="indicadores-bajas-item-details">
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
