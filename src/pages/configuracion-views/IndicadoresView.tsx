import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserRound,
  UserRoundMinus,
  UserRoundPlus,
} from 'lucide-react';
import { useIndicadoresStats } from '@/hooks/useIndicadoresStats';

interface IndicatorCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  description: string;
  valueClassName?: string;
}

function IndicatorCard({
  icon,
  label,
  value,
  description,
  valueClassName = '',
}: IndicatorCardProps) {
  return (
    <article className="indicadores-kpi-card">
      <div className="indicadores-kpi-card__header">
        <span className="indicadores-kpi-card__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="indicadores-kpi-label">{label}</h3>
      </div>
      <p className={`indicadores-kpi-value ${valueClassName}`.trim()}>{value}</p>
      <p className="indicadores-kpi-sub">{description}</p>
    </article>
  );
}

export function IndicadoresView() {
  const [selectedMobileRecruiter, setSelectedMobileRecruiter] = useState<string | null>(null);
  const mobileDetailBackRef = useRef<HTMLButtonElement>(null);
  const recruiterButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { recruiters, tableData, kpi, historicalGoals, loading, error } = useIndicadoresStats(selectedMonth);

  if (error) {
    return (
      <section className="indicadores-view config-page" aria-labelledby="indicadores-page-title">
        <h1 id="indicadores-page-title" className="config-page__title">
          Indicadores
        </h1>
        <div className="config-empty" role="alert">
          <p className="text-error type-body-md">{error}</p>
        </div>
      </section>
    );
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectMobileRecruiter = (recruiter: string) => {
    setSelectedMobileRecruiter(recruiter);
  };

  const handleBackToRecruiters = () => {
    const recruiter = selectedMobileRecruiter;
    setSelectedMobileRecruiter(null);
    window.requestAnimationFrame(() => {
      if (recruiter) recruiterButtonRefs.current.get(recruiter)?.focus();
    });
  };

  useEffect(() => {
    if (!selectedMobileRecruiter) return;
    const frame = window.requestAnimationFrame(() => {
      mobileDetailBackRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedMobileRecruiter]);

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  };

  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(selectedMonth);
  const monthValue = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;

  return (
    <BoneyardSkeleton
      name="configuracion-indicadores"
      loading={loading}
      loadingLabel="Cargando indicadores…"
    >
      <section className="indicadores-view config-page" aria-labelledby="indicadores-page-title">
      <header className="indicadores-page-header">
        <h1 id="indicadores-page-title" className="config-page__title">
          Indicadores
        </h1>

        <div className="indicadores-period" aria-label="Periodo de los indicadores">
          <CalendarRange aria-hidden="true" />
          <div className="indicadores-month-nav">
            <button
              type="button"
              className="btn-icon"
              onClick={handlePrevMonth}
              aria-label="Mostrar mes anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <time
              className="indicadores-month-nav__label"
              dateTime={monthValue}
            >
              {monthLabel}
            </time>
            <button
              type="button"
              className="btn-icon"
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
              aria-label="Mostrar mes siguiente"
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {kpi && (
        <section className="indicadores-section" aria-labelledby="indicadores-summary-title">
          <div className="indicadores-section__heading">
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <h2 id="indicadores-summary-title">Resumen mensual</h2>
          </div>
          <div className="indicadores-kpi-grid">
            <IndicatorCard
              icon={<UserRoundPlus />}
              label="Total ingresos"
              value={<>
                {kpi.totalIngresos}
              {kpi.prevMonthTotalIngresos > 0 && (
                <span
                  className={`indicadores-kpi-trend ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? 'text-success' : 'text-error'}`}
                  aria-label={`${Math.abs(kpi.totalIngresos - kpi.prevMonthTotalIngresos)} ingresos ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? 'más' : 'menos'} que el mes anterior`}
                >
                  {kpi.totalIngresos >= kpi.prevMonthTotalIngresos
                    ? <TrendingUp aria-hidden="true" />
                    : <TrendingDown aria-hidden="true" />}
                  {kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? '+' : '−'}
                  {Math.abs(kpi.totalIngresos - kpi.prevMonthTotalIngresos)}
                </span>
              )}
              </>}
              description={`${tableData.length} semana${tableData.length === 1 ? '' : 's'} registrada${tableData.length === 1 ? '' : 's'}`}
            />
            <IndicatorCard
              icon={<ChartNoAxesColumnIncreasing />}
              label="Promedio semanal"
              value={kpi.promedio}
              description="Ingresos por semana"
            />
            <IndicatorCard
              icon={<Trophy />}
              label="Top reclutador"
              value={kpi.topRecruiters.length > 1
                ? kpi.topRecruiters.map((recruiter) => recruiter.name).join(' y ')
                : kpi.topRecruiters[0]?.name ?? 'Sin datos'}
              valueClassName="indicadores-kpi-value--name"
              description={kpi.topRecruiters.length > 1
                ? `Empate con ${kpi.topRecruiters[0]?.total} ingresos cada una`
                : `${kpi.topRecruiters[0]?.total ?? 0} ingresos`}
            />
            <IndicatorCard
              icon={<Target />}
              label="Meta mensual"
              value={<>
                {kpi.reclutadoresEnMeta}
                <span className="indicadores-kpi-total-suffix">/ {kpi.recruiterTotals.length}</span>
              </>}
              description={`Reclutadores con al menos ${kpi.metaMensual} ingresos`}
            />
          </div>
        </section>
      )}

      {/* ── Historial de Metas ──────────────────────────────────── */}
      {historicalGoals && historicalGoals.length > 0 && (
        <section className="indicadores-section indicadores-historical-grid" aria-labelledby="indicadores-goals-title">
          <div className="indicadores-section__heading">
            <Award aria-hidden="true" />
            <h2 id="indicadores-goals-title">Metas acumuladas</h2>
          </div>
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
                <button
                  type="button"
                  className="indicadores-historical-card"
                  aria-label={`${rec.name}: ${rec.monthsCompleted} ${rec.monthsCompleted === 1 ? 'mes con meta lograda' : 'meses con meta lograda'}`}
                >
                  <Award aria-hidden="true" />
                  <span className="indicadores-historical-card__name">{rec.name}</span>
                  <span className="indicadores-historical-card__value">{rec.monthsCompleted} {rec.monthsCompleted === 1 ? 'mes' : 'meses'}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </section>
      )}

      {!kpi && (
        <div className="config-empty" role="status">
          <ChartNoAxesColumnIncreasing className="config-empty__icon" aria-hidden="true" />
          <p className="config-empty__copy type-body-md">
            No hay indicadores disponibles para este periodo.
          </p>
        </div>
      )}


      {/* ── Tabla transpuesta: Reclutadores × Semanas ────────────── */}
      {kpi && <section className="indicadores-card indicadores-table-card" aria-labelledby="indicadores-breakdown-title">
        <div className="indicadores-table-header">
          <div className="indicadores-section__heading">
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <h2 id="indicadores-breakdown-title">Ingresos por reclutador</h2>
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
            <tbody>
              {recruiters.map((recruiter, index) => (
                <tr key={recruiter}>
                  <th scope="row" className="indicadores-table-row-header">
                    <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
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
                </tr>
              ))}
            </tbody>
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
                ref={mobileDetailBackRef}
                type="button"
                className="btn-text config-mobile-back"
                onClick={handleBackToRecruiters}
                aria-label="Volver a la lista de reclutadores"
              >
                <ArrowLeft aria-hidden="true" />
                Volver
              </button>
              
              <div className="indicadores-mobile-detail__header">
                <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                <h3 className="type-heading-md m-0">{selectedMobileRecruiter}</h3>
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
                    ref={(node) => {
                      if (node) recruiterButtonRefs.current.set(recruiter, node);
                      else recruiterButtonRefs.current.delete(recruiter);
                    }}
                    type="button"
                    className="indicadores-mobile-list__btn"
                    onClick={() => handleSelectMobileRecruiter(recruiter)}
                  >
                    <div className="indicadores-mobile-list__info">
                      <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                      <span className="type-body-sm font-medium text-ink">{recruiter}</span>
                    </div>
                    <div className="indicadores-mobile-list__right">
                      <span className="type-caption-sm text-muted">
                        {kpi?.recruiterTotals[index]?.total ?? 0} ingresos
                      </span>
                      <ArrowRight className="text-muted-soft" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>}

      {/* ── Sección de Retención y Efectividad ──────────────────── */}

      {kpi && (
        <section className="indicadores-section" aria-labelledby="indicadores-retention-title">
          <div className="indicadores-section__heading">
            <UserRoundMinus aria-hidden="true" />
            <h2 id="indicadores-retention-title">Retención y efectividad</h2>
          </div>
          <div className="indicadores-kpi-grid indicadores-kpi-grid--compact">
            <IndicatorCard
              icon={<UserRoundMinus />}
              label="Total bajas"
              value={kpi.totalBajasMes}
              valueClassName="text-error"
              description="Personal inactivo"
            />
            <IndicatorCard
              icon={<Timer />}
              label="Promedio permanencia"
              value={kpi.promedioPermanenciaGlobal}
              description="Días antes de baja"
            />
          </div>

          <div className="indicadores-card indicadores-table-card">
            <div className="indicadores-table-header">
              <div className="indicadores-section__heading">
                <Target aria-hidden="true" />
                <h3>Desempeño por reclutador</h3>
              </div>
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
                  {recruiters.map((recruiter) => {
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
                          <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
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
                {recruiters.map((recruiter) => {
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
                      <div className="indicadores-mobile-list__row">
                        <div className="indicadores-mobile-list__info">
                          <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                          <div className="indicadores-mobile-list__text">
                            <span className="type-body-sm font-medium text-ink">{recruiter}</span>
                            <span className="type-caption-sm text-muted">Ingresos: {stats.totalIngresos} &nbsp;|&nbsp; Bajas: <span className="text-error font-medium">{stats.totalBajas}</span></span>
                          </div>
                        </div>
                        <div className="indicadores-mobile-list__right">
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
                <div className="indicadores-section__heading">
                  <UserRoundMinus aria-hidden="true" />
                  <h3>Detalle de personal inactivo</h3>
                </div>
              </div>
              <div className="indicadores-bajas-grid">
                {recruiters.map(recruiter => {
                  const bajasOfRecruiter = kpi.bajasList.filter(b => b.reclutador === recruiter);
                  if (bajasOfRecruiter.length === 0) return null;
                  
                  return (
                    <div key={`bajas-col-${recruiter}`} className="indicadores-bajas-col">
                      <h4 className="indicadores-bajas-header type-body-sm font-bold uppercase">{recruiter}</h4>
                      <ul className="indicadores-bajas-list">
                        {bajasOfRecruiter.map((baja, i) => {
                          const TARGET_RETENTION_DAYS = 90;
                          const efficiencyRaw = (baja.dias / TARGET_RETENTION_DAYS) * 100;
                          const efficiency = Math.min(Math.round(efficiencyRaw), 100);

                          let efficiencyClass = "text-error";
                          if (efficiency >= 80) {
                            efficiencyClass = "text-success";
                          } else if (efficiency >= 30) {
                            efficiencyClass = "text-warning";
                          }

                          return (
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
                                  <span className="type-caption-sm text-muted">
                                    <strong>Baja:</strong> {baja.fechaBaja} ({baja.dias} días)
                                  </span>
                                  <span 
                                    className={`type-caption-sm font-medium ${efficiencyClass}`}
                                    aria-label={`Eficiencia de contratación: ${efficiency} por ciento`}
                                  >
                                    <strong>Eficiencia:</strong> {efficiency}%
                                  </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
      </section>
    </BoneyardSkeleton>
  );
}
