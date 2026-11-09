import { useMemo, useState } from 'react';
import { CalendarDays, CircleAlert, Scale, Timer, UserRoundMinus, UserRoundPlus } from 'lucide-react';
import { localizeNavigationText } from '@/components/layout/navigation';
import { PageHeading } from '@/components/layout/PageHeading';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBajas } from '@/hooks/useBajas';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { usePagination } from '@/hooks/usePagination';
import { formatCompactDateRange, formatShortDate, lastCompletedQuarter } from '@/lib/dates';
import { usePositions } from '@/lib/positions';
import { bajaKey } from '@/lib/requisicion';
import { workforceText } from '@/pages/workforce-translations';
import { REPORT_SGI_LABEL } from './report-sgi/navigation';
import { buildQuarterReports, REPORT_SGI_DEPARTMENTS, type DepartmentQuarterReport } from './report-sgi/quarterlyData';
import './ReportSgiPage.css';

type CoverageBadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

interface CoverageBadge {
  label: string;
  variant: CoverageBadgeVariant;
}

function getCoverageBadge(
  baja: DepartmentQuarterReport['rows'][number],
  text: (value: string) => string,
): CoverageBadge {
  if (baja.soloInduccion) {
    return { label: text('No aplica'), variant: 'neutral' };
  }
  if (baja.cubiertaEn10d) {
    return { label: text('Cubierta'), variant: 'success' };
  }
  if (baja.coberturaDias !== null) {
    return { label: text('Cobertura tardía'), variant: 'warning' };
  }
  return { label: text('Sin cobertura'), variant: 'error' };
}

function formatCoverageDays(baja: DepartmentQuarterReport['rows'][number], text: (value: string) => string): string {
  if (baja.soloInduccion) return '—';
  if (baja.coberturaDias !== null) {
    return `${baja.coberturaDias} ${text('días')}`;
  }
  if (baja.cubiertaPor === 'manual') return text('Manual');
  return '—';
}

function ReportSgiLoading({ label }: { label: string }) {
  return (
    <LoadingSkeleton label={label} className="report-sgi__skeleton">
      <div aria-hidden="true" className="report-sgi__skeleton-content">
        <div className="report-sgi__skeleton-intro">
          <span className="loading-skeleton__bone report-sgi__skeleton-period" />
          <span className="loading-skeleton__bone report-sgi__skeleton-reference" />
        </div>
        <div className="report-sgi__skeleton-tabs">
          <span className="loading-skeleton__bone report-sgi__skeleton-tab" />
          <span className="loading-skeleton__bone report-sgi__skeleton-tab" />
        </div>
        <div className="report-sgi__kpis">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="loading-skeleton__bone report-sgi__skeleton-kpi" />
          ))}
        </div>
        <div className="report-sgi__skeleton-rows">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="loading-skeleton__bone report-sgi__skeleton-row" />
          ))}
        </div>
      </div>
    </LoadingSkeleton>
  );
}

export function ReportSgiPage() {
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const text = (value: string) => workforceText(language, value);

  const { employees, loading: employeesLoading, error: employeesError } = useSupabaseData();
  const { bajas, loading: bajasLoading, error: bajasError, retrySync } = useBajas();
  const { positions, loading: positionsLoading } = usePositions();

  const quarter = useMemo(() => lastCompletedQuarter(), []);
  const [activeDepartment, setActiveDepartment] = useState<string>(REPORT_SGI_DEPARTMENTS[0].id);

  const reports = useMemo(() => {
    return buildQuarterReports(quarter, bajas, employees, positions);
  }, [bajas, employees, positions, quarter]);
  const productionPagination = usePagination(reports.get('produccion')?.rows ?? [], 7);
  const qualityPagination = usePagination(reports.get('calidad')?.rows ?? [], 7);
  const paginationByDepartment = {
    produccion: productionPagination,
    calidad: qualityPagination,
  };

  const loading =
    (bajasLoading && bajas.length === 0) || (employeesLoading && employees.length === 0) || positionsLoading;
  const dataError = bajasError ?? employeesError;
  const referenceStaffing = reports.get(activeDepartment)?.referenceStaffing;

  return (
    <main className="report-sgi container" aria-labelledby="report-sgi-title">
      <PageHeading id="report-sgi-title" className="app-page-title">
        {localizeNavigationText(language, REPORT_SGI_LABEL)}
      </PageHeading>

      {loading ? (
        <ReportSgiLoading label={text('Cargando reporte…')} />
      ) : (
        <>
          <header className="report-sgi__intro">
            <p className="report-sgi__period">
              <CalendarDays size="var(--icon-size-sm)" aria-hidden="true" />
              <span>
                {language === 'en' ? `Q${quarter.quarter} ${quarter.year}` : `T${quarter.quarter} ${quarter.year}`}
                {' · '}
                {formatCompactDateRange(quarter.start, quarter.end, locale)}
              </span>
            </p>
            {referenceStaffing && (
              <p className="report-sgi__reference">
                <span className="sr-only">{text('Referencia del turno 1')}: </span>
                {text('Plantilla Aut.')} {referenceStaffing.authorized} + {referenceStaffing.backup} {text('BackUp')}
              </p>
            )}
          </header>

          {dataError && (
            <div className="report-sgi__alert" role="alert">
              <CircleAlert size="var(--icon-size-md)" aria-hidden="true" />
              <p>{text('No se pudo cargar el reporte.')}</p>
              {bajasError && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    void retrySync();
                  }}
                >
                  {text('Reintentar')}
                </button>
              )}
            </div>
          )}

          <TabsRoot className="report-sgi__tabs" value={activeDepartment} onValueChange={setActiveDepartment}>
            <TabsList variant="underline" aria-label={text('Área')}>
              {REPORT_SGI_DEPARTMENTS.map((department) => (
                <TabsTrigger key={department.id} value={department.id}>
                  {text(department.label)}
                </TabsTrigger>
              ))}
            </TabsList>

            {REPORT_SGI_DEPARTMENTS.map((department) => {
              const report = reports.get(department.id);
              if (!report) return null;
              const balance = report.ingresos - report.bajas;
              const pagination = paginationByDepartment[department.id];

              return (
                <TabsContent key={department.id} value={department.id}>
                  <section className="report-sgi__department" aria-label={text(department.label)}>
                    {report.authorizedPositions === 0 && (
                      <p className="report-sgi__notice">{text('Sin plantilla autorizada para este departamento.')}</p>
                    )}

                    <div className="report-sgi__kpis">
                      <KpiCard
                        label={text('Ingresos')}
                        value={report.ingresos}
                        icon={<UserRoundPlus size="var(--icon-size-md)" aria-hidden="true" />}
                      />
                      <KpiCard
                        label={text('Bajas')}
                        value={report.bajas}
                        sub={
                          report.soloInduccion > 0
                            ? `${report.soloInduccion} ${text('excluidas por solo inducción')}`
                            : undefined
                        }
                        icon={<UserRoundMinus size="var(--icon-size-md)" aria-hidden="true" />}
                      />
                      <KpiCard
                        label={text('Balance')}
                        value={balance > 0 ? `+${balance}` : String(balance)}
                        sub={text('Ingresos menos bajas')}
                        icon={<Scale size="var(--icon-size-md)" aria-hidden="true" />}
                      />
                      <KpiCard
                        label={text('Cobertura promedio')}
                        value={report.averageCoverage === null ? '—' : `${report.averageCoverage} ${text('días')}`}
                        sub={`${report.cubiertas}/${report.bajas} ${text('cubiertas')}`}
                        icon={<Timer size="var(--icon-size-md)" aria-hidden="true" />}
                      />
                    </div>

                    {report.rows.length === 0 ? (
                      <p className="report-sgi__empty">{text('Sin bajas registradas en el trimestre.')}</p>
                    ) : (
                      <>
                        <div className="report-sgi__table-wrap">
                          <table className="report-sgi__table data-table data-table--cards">
                            <caption className="sr-only">
                              {`${text('Detalle de bajas del trimestre')}: ${text(department.label)}`}
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">{text('Colaborador')}</th>
                                <th scope="col">{text('Puesto')}</th>
                                <th scope="col">{text('Fecha de baja')}</th>
                                <th scope="col" className="report-sgi__th--num">
                                  {text('Cobertura')}
                                </th>
                                <th scope="col">{text('Estado')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagination.pageItems.map((baja) => {
                                const badge = getCoverageBadge(baja, text);
                                return (
                                  <tr key={bajaKey(baja)}>
                                    <th scope="row" data-label={text('Colaborador')}>
                                      <span className="report-sgi__person">{baja.nombre}</span>
                                      <span className="report-sgi__person-id">#{baja.num_empleado}</span>
                                    </th>
                                    <td data-label={text('Puesto')}>
                                      <span className="report-sgi__puesto">{baja.puesto || '—'}</span>
                                    </td>
                                    <td data-label={text('Fecha de baja')}>
                                      {formatShortDate(baja.fecha_baja, locale)}
                                    </td>
                                    <td data-label={text('Cobertura')} className="report-sgi__td--num">
                                      {formatCoverageDays(baja, text)}
                                    </td>
                                    <td data-label={text('Estado')}>
                                      <Badge variant={badge.variant} size="compact">
                                        {badge.label}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <Pagination
                          currentPage={pagination.currentPage}
                          totalPages={pagination.totalPages}
                          onPageChange={pagination.goToPage}
                          canGoPrev={pagination.canGoPrev}
                          canGoNext={pagination.canGoNext}
                          ariaLabel={`${text('Paginación de bajas')}: ${text(department.label)}`}
                        />
                      </>
                    )}
                  </section>
                </TabsContent>
              );
            })}
          </TabsRoot>
        </>
      )}
    </main>
  );
}
