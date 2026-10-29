import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  ArrowRight,
  Award,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { getConfiguracionCopy } from './configuracion-translations';
import { MetricsDepartures } from './MetricsDepartures';
import './IndicadoresView.css';

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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).indicators;
  const english = language === 'en';
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);
  const [selectedMobileRecruiter, setSelectedMobileRecruiter] = useState<string | null>(null);
  const mobileDetailBackRef = useRef<HTMLButtonElement>(null);
  const recruiterButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { recruiters, tableData, kpi, recruiterFilters, loading, error } = useIndicadoresStats(selectedMonth, selectedRecruiter);
  const displayRecruiter = (recruiter: string) =>
    recruiter === 'Sin Reclutador' ? copy.unassignedRecruiter : recruiter;

  if (error) {
    return (
      <section className="indicadores-view config-page" aria-labelledby="indicadores-page-title">
        <PageHeading id="indicadores-page-title" className="config-page__title app-page-title">
          {copy.title}
        </PageHeading>
        <div className="config-empty" role="alert">
          <p className="text-error type-body-md">{english ? copy.loadError : error}</p>
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

  const monthLabel = new Intl.DateTimeFormat(english ? 'en-US' : 'es-MX', { month: 'long', year: 'numeric' }).format(selectedMonth);
  const shortMonthLabel = new Intl.DateTimeFormat(english ? 'en-US' : 'es-MX', { month: 'short', year: 'numeric' }).format(selectedMonth);
  const monthValue = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;

  return (
    <BoneyardSkeleton
      name="configuracion-indicadores"
      loading={loading}
      loadingLabel={copy.loading}
    >
      <section className="indicadores-view config-page" aria-labelledby="indicadores-page-title">
        <PageHeading id="indicadores-page-title" className="config-page__title app-page-title">
          {copy.title}
        </PageHeading>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {kpi && (
        <section className="indicadores-section metrics-summary" aria-labelledby="indicadores-summary-title">
          <div className="indicadores-section__heading sr-only">
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <h2 id="indicadores-summary-title">{copy.summary}</h2>
          </div>
          <div className="indicadores-kpi-grid indicadores-kpi-grid--summary">
            <IndicatorCard
              icon={<UserRoundPlus />}
              label={copy.totalIncome}
              value={<>
                {kpi.totalIngresos}
              {kpi.prevMonthTotalIngresos > 0 && (
                <span
                  className={`indicadores-kpi-trend ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? 'text-success' : 'text-error'}`}
                  aria-label={`${Math.abs(kpi.totalIngresos - kpi.prevMonthTotalIngresos)} ${copy.incomeCount} ${kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? copy.more : copy.fewer} ${copy.thanPreviousMonth}`}
                >
                  {kpi.totalIngresos >= kpi.prevMonthTotalIngresos
                    ? <TrendingUp aria-hidden="true" />
                    : <TrendingDown aria-hidden="true" />}
                  {kpi.totalIngresos >= kpi.prevMonthTotalIngresos ? '+' : '−'}
                  {Math.abs(kpi.totalIngresos - kpi.prevMonthTotalIngresos)}
                </span>
              )}
              </>}
              description={`${tableData.length} ${tableData.length === 1 ? copy.weekRecorded : copy.weeksRecorded}`}
            />
            <IndicatorCard
              icon={<ChartNoAxesColumnIncreasing />}
              label={copy.weeklyAverage}
              value={kpi.promedio}
              description={`${tableData.length} ${tableData.length === 1 ? copy.weekRecorded : copy.weeksRecorded}`}
            />
            <IndicatorCard
              icon={<Trophy />}
              label={selectedRecruiter ? copy.recruiter : copy.topRecruiter}
              value={selectedRecruiter ? displayRecruiter(selectedRecruiter) : kpi.topRecruiters.length > 1
                ? kpi.topRecruiters.map((recruiter) => displayRecruiter(recruiter.name)).join(english ? ' and ' : ' y ')
                : kpi.topRecruiters[0] ? displayRecruiter(kpi.topRecruiters[0].name) : copy.noData}
              valueClassName="indicadores-kpi-value--name"
              description={selectedRecruiter ? `${kpi.recruiterTotals[0]?.total ?? 0} ${copy.incomeCount}` : kpi.topRecruiters.length > 1
                ? `${copy.tie} ${kpi.topRecruiters[0]?.total} ${copy.incomeEach}`
                : `${kpi.topRecruiters[0]?.total ?? 0} ${copy.incomeCount}`}
            />
            <IndicatorCard
              icon={<Target />}
              label={copy.monthlyGoal}
              value={<>
                {kpi.reclutadoresEnMeta}
                <span className="indicadores-kpi-total-suffix">/ {kpi.recruiterTotals.length}</span>
              </>}
              description={`${copy.recruitersWithAtLeast} ${kpi.metaMensual} ${copy.incomeCount}`}
            />
          </div>
        </section>
      )}

      {/* ── Historial de Metas ──────────────────────────────────── */}
      <section className="indicadores-section indicadores-historical-grid metrics-toolbar" aria-labelledby="indicadores-goals-title">
        <div className="indicadores-section__heading indicadores-section__heading--period">
          <div className="indicadores-section__heading-label">
            <Award aria-hidden="true" />
            <h2 id="indicadores-goals-title">{copy.historicalGoals}</h2>
          </div>
          <div className="indicadores-period" aria-label={copy.period}>
            <div className="indicadores-month-nav">
              <button
                type="button"
                className="step-nav-control"
                data-cuelume-navigate="" onClick={handlePrevMonth}
                aria-label={copy.previousMonth}
              >
                <ArrowLeft aria-hidden="true" />
              </button>
              <time
                className="indicadores-month-nav__label"
                dateTime={monthValue}
                aria-label={monthLabel}
              >
                <span className="indicadores-month-nav__short-label" aria-hidden="true">{shortMonthLabel}</span>
                <span className="indicadores-month-nav__full-label" aria-hidden="true">{monthLabel}</span>
              </time>
              <button
                type="button"
                className="step-nav-control"
                data-cuelume-navigate="" onClick={handleNextMonth}
                disabled={isCurrentMonth()}
                aria-label={copy.nextMonth}
              >
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        {recruiterFilters.length > 0 && (
          <div className="indicadores-historical-list" role="group" aria-label={copy.filterRecruiter}>
            <button type="button" className="indicadores-historical-card" data-cuelume-select=""
              aria-pressed={selectedRecruiter === null} onClick={() => { setSelectedRecruiter(null); setSelectedMobileRecruiter(null); }}>
              {copy.allRecruiters}
            </button>
            {recruiterFilters.map(name => <button key={name} type="button" className="indicadores-historical-card"
              data-cuelume-select="" aria-pressed={selectedRecruiter === name}
              onClick={() => { setSelectedRecruiter(name); setSelectedMobileRecruiter(null); }}>
              <span className="indicadores-historical-card__name">{name}</span>
            </button>)}
          </div>
        )}
      </section>

      {!kpi && (
        <div className="config-empty" role="status">
          <ChartNoAxesColumnIncreasing className="config-empty__icon" aria-hidden="true" />
          <p className="config-empty__copy type-body-md">
            {copy.noPeriodData}
          </p>
        </div>
      )}


      {/* ── Tabla transpuesta: Reclutadores × Semanas ────────────── */}
      {kpi && <section className="indicadores-card indicadores-table-card metrics-weekly" aria-labelledby="indicadores-breakdown-title">
        <div className="indicadores-table-header">
          <div className="indicadores-section__heading">
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <h2 id="indicadores-breakdown-title">{copy.incomeByWeek}</h2>
          </div>
        </div>
        <div className="table-responsive indicadores-desktop-only">
          <table className="indicadores-table data-table" aria-label={copy.incomeBreakdown}>
            <caption className="sr-only">{copy.detailedIncomeBreakdown}</caption>
            <thead>
              <tr>
                <th scope="col" className="indicadores-table-sticky">{copy.recruiter}</th>
                {tableData.map(row => (
                  <th scope="col" key={row.date}>{row.date}</th>
                ))}
                <th scope="col" className="text-right">{copy.total}</th>
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
                          <span className={`indicador-value ${valClass}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-muted-soft">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="type-body-strong text-right">
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
            {tableData.length > 0 && !selectedRecruiter && (
              <tfoot>
                <tr>
                  <th scope="row">{copy.totalByWeek}</th>
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
                      <td key={row.date} className="type-body-strong">
                        <span className={`indicador-value ${totalClass}`}>{row.total}</span>
                      </td>
                    );
                  })}
                  <td className="text-right type-body-strong">
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
              <div className="indicadores-mobile-detail__header">
                <div className="indicadores-mobile-detail__recruiter">
                  <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                  <h3 className="type-body-strong m-0">{displayRecruiter(selectedMobileRecruiter)}</h3>
                </div>
                <BackButton
                  ref={mobileDetailBackRef}
                  className="config-mobile-back"
                  label={copy.back}
                  data-cuelume-navigate="" onClick={handleBackToRecruiters}
                  aria-label={copy.backToRecruiters}
                />
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
                      <span className="type-body-md">{row.date}</span>
                      <span className="type-body-strong text-ink">
                        {val ? (
                          <span className={valClass}>
                            {val} {copy.incomeCount}
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
                <span className="type-body-strong">{copy.total}</span>
                <span className="type-body-strong text-primary">
                  {kpi?.recruiterTotals[recruiters.indexOf(selectedMobileRecruiter)]?.total ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <ul className="indicadores-mobile-list" aria-label={copy.recruiterList}>
              {recruiters.map((recruiter, index) => (
                <li key={recruiter}>
                  <button
                    ref={(node) => {
                      if (node) recruiterButtonRefs.current.set(recruiter, node);
                      else recruiterButtonRefs.current.delete(recruiter);
                    }}
                    type="button"
                    className="indicadores-mobile-list__btn"
                    data-cuelume-open="" onClick={() => handleSelectMobileRecruiter(recruiter)}
                  >
                    <div className="indicadores-mobile-list__info">
                      <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                      <span className="type-body-strong text-ink">{displayRecruiter(recruiter)}</span>
                    </div>
                    <div className="indicadores-mobile-list__right">
                      <span className="type-body-md text-muted">
                        {kpi?.recruiterTotals[index]?.total ?? 0} {copy.incomeCount}
                      </span>
                      <ArrowRight className="text-muted-soft" aria-hidden="true" />
                    </div>
                    <progress className="metrics-recruiter-progress" max={Math.max(1, ...kpi.recruiterTotals.map((item) => item.total))}
                      value={kpi.recruiterTotals[index]?.total ?? 0} aria-label={`${displayRecruiter(recruiter)}: ${kpi.recruiterTotals[index]?.total ?? 0} ${copy.incomeCount}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>}

      {/* ── Sección de Retención y Efectividad ──────────────────── */}

      {kpi && (
        <section className="indicadores-section metrics-retention" aria-labelledby="indicadores-retention-title">
          <div className="metrics-retention-overview">
            <div className="indicadores-section__heading">
              <UserRoundMinus aria-hidden="true" />
              <h2 id="indicadores-retention-title">{copy.retention}</h2>
            </div>
            <div className="indicadores-kpi-grid indicadores-kpi-grid--compact">
            <IndicatorCard
              icon={<UserRoundMinus />}
              label={copy.totalLeavers}
              value={kpi.totalBajasMes}
              valueClassName="text-error"
              description={copy.inactiveStaff}
            />
            <IndicatorCard
              icon={<Timer />}
              label={copy.averageTenure}
              value={kpi.promedioPermanenciaGlobal}
              description={copy.daysBeforeLeaving}
            />
            </div>
            <div className="metrics-retention-overview__global">
              <span><strong>{copy.globalRetention}</strong><small>{copy.weightedByHires}</small></span>
              <strong>{kpi.totalIngresos > 0 ? Math.round((kpi.totalIngresos - kpi.totalBajasMes) / kpi.totalIngresos * 100) : 100}%</strong>
            </div>
          </div>

          <div className="indicadores-card indicadores-table-card metrics-performance">
            <div className="indicadores-table-header">
              <div className="indicadores-section__heading">
                <Target aria-hidden="true" />
                <h3>{copy.performanceByRecruiter}</h3>
              </div>
            </div>
            <div className="table-responsive indicadores-desktop-only">
              <table className="indicadores-table data-table" aria-label={copy.recruiterEffectiveness}>
                <caption className="sr-only">{copy.retentionSummary}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="indicadores-table-sticky">{copy.recruiter}</th>
                    <th scope="col" className="text-right">{copy.hires}</th>
                    <th scope="col" className="text-right">{copy.leavers}</th>
                    <th scope="col" className="text-right">{copy.retentionPercent}</th>
                    <th scope="col" className="text-right">{copy.averageDays}</th>
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
                          {displayRecruiter(recruiter)}
                        </th>
                        <td className="type-body-md text-right">{stats.totalIngresos}</td>
                        <td className="type-body-strong text-right text-error">{stats.totalBajas > 0 ? stats.totalBajas : '-'}</td>
                        <td className="text-right">
                          <Badge variant={retention >= 70 ? 'success' : 'amber'}>
                            {retention}% · {retention >= 70 ? copy.favorable : copy.attention}
                          </Badge>
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
              <ul className="indicadores-mobile-list" aria-label={english ? "Retention by recruiter" : "Retención por reclutador"}>
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
                      <div className="indicadores-mobile-list__row metrics-performance__row">
                        <div className="metrics-performance__identity">
                          <UserRound className="indicadores-recruiter-icon" aria-hidden="true" />
                          <span className="type-body-strong text-ink">{displayRecruiter(recruiter)}</span>
                        </div>
                        <Badge variant={retention >= 70 ? 'success' : 'amber'}>
                          {retention}% · {retention >= 70 ? copy.favorable : copy.attention}
                        </Badge>
                        <div className="metrics-performance__facts type-body-md text-muted">
                          <span>{copy.hires}: <strong>{stats.totalIngresos}</strong></span>
                          <span>{copy.leavers}: <strong className="text-error">{stats.totalBajas}</strong></span>
                          <span>{copy.averageShort} <strong>{avgDays}{copy.daysShort}</strong></span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <MetricsDepartures items={kpi.bajasList} copy={copy} english={english} />
        </section>
      )}
      </section>
    </BoneyardSkeleton>
  );
}
