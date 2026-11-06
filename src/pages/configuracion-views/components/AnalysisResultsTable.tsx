import '@/components/ui/LoadingSkeleton.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import { getIncidenceBadgeVariant } from '@/components/reporte-diario/helpers';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { formatShortDate } from '@/lib/dates';
import {
  displayValue,
  getEmployeeResultId,
  getRecentEmployeeIncidents,
  type EmployeeSearchResult,
} from '../analisis-helpers';
import { getConfiguracionCopy } from '../configuracion-translations';

interface AnalysisResultsTableProps {
  employees: EmployeeSearchResult[];
  reports: ReporteDiarioRecord[];
  reportsLoading: boolean;
  reportsFetched: boolean;
  reportsError: boolean;
  onRetryReports: () => void;
  onSelectEmployee: (employee: EmployeeSearchResult, trigger: HTMLButtonElement) => void;
}

export function AnalysisResultsTable({
  employees,
  reports,
  reportsLoading,
  reportsFetched,
  reportsError,
  onRetryReports,
  onSelectEmployee,
}: AnalysisResultsTableProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).analysis;
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const incidenceLabels: Readonly<Record<string, string>> = copy.incidenceLabels;
  const isLoadingIncidents = reportsLoading || !reportsFetched;

  const getLocalizedValue = (value: unknown) => (String(value ?? '').trim() ? displayValue(value) : copy.noInformation);

  return (
    <>
      {reportsError && (
        <p className="config-incidence-error" role="alert">
          {copy.incidentsLoadError}{' '}
          <ButtonUtility type="button" disabled={reportsLoading} onClick={onRetryReports}>
            {copy.retryIncidents}
          </ButtonUtility>
        </p>
      )}
      {isLoadingIncidents && (
        <span className="sr-only" role="status" aria-live="polite">
          {copy.loadingIncidents}
        </span>
      )}
      <div className="analisis-results-table-wrap">
        <table className="analisis-results-table data-table">
          <caption className="sr-only">{copy.results}</caption>
          <colgroup>
            <col className="analisis-results-table__column--number" />
            <col className="analisis-results-table__column--name" />
            <col className="analisis-results-table__column--position" />
            <col className="analisis-results-table__column--hire-date" />
            <col className="analisis-results-table__column--incidents" />
          </colgroup>
          <thead className="analisis-results-table__head">
            <tr>
              <th scope="col">
                <span className="analisis-results-table__desktop-label">{copy.number}</span>
                <span className="analisis-results-table__tablet-label">
                  {copy.number} • {copy.employeeName}
                </span>
              </th>
              <th scope="col" className="analisis-results-table__name-column">
                {copy.employeeName}
              </th>
              <th scope="col">{copy.position}</th>
              <th scope="col">{copy.hireDate}</th>
              <th scope="col">{copy.incidentsColumn}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const resultId = getEmployeeResultId(employee);
              const incidents = getRecentEmployeeIncidents(employee.num_empleado, reports);

              return (
                <tr
                  key={resultId}
                  className="analisis-results-table__row"
                  onClick={(event) => {
                    const trigger = event.currentTarget.querySelector<HTMLButtonElement>(
                      '.analisis-results-table__detail-trigger',
                    );
                    if (trigger) onSelectEmployee(employee, trigger);
                  }}
                >
                  <th scope="row" data-label={copy.number}>
                    <button
                      type="button"
                      className="analisis-results-table__detail-trigger"
                      aria-label={`${copy.viewEmployeeDetails}: ${getLocalizedValue(employee.num_empleado)}, ${getLocalizedValue(employee.nombre)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEmployee(employee, event.currentTarget);
                      }}
                    >
                      <span className="analisis-results-table__number">{getLocalizedValue(employee.num_empleado)}</span>
                      <span className="analisis-results-table__tablet-identity">
                        <span>{getLocalizedValue(employee.num_empleado)}</span>
                        <span aria-hidden="true"> • </span>
                        <span>{getLocalizedValue(employee.nombre)}</span>
                      </span>
                    </button>
                  </th>
                  <td className="analisis-results-table__name-column" data-label={copy.employeeName}>
                    {getLocalizedValue(employee.nombre)}
                  </td>
                  <td data-label={copy.position}>{getLocalizedValue(employee.puesto)}</td>
                  <td data-label={copy.hireDate}>
                    <time dateTime={employee.fecha_ingreso || undefined}>
                      {formatShortDate(employee.fecha_ingreso, locale)}
                    </time>
                  </td>
                  <td
                    className="analisis-results-table__incidents-cell"
                    data-label={copy.incidentsColumn}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {reportsError ? (
                      <span>{copy.incidentsUnavailable}</span>
                    ) : isLoadingIncidents ? (
                      <span className="analisis-results-table__incident-skeleton" aria-hidden="true">
                        <span className="loading-skeleton__bone" />
                        <span className="loading-skeleton__bone" />
                        <span className="loading-skeleton__bone" />
                      </span>
                    ) : incidents.length > 0 ? (
                      <ul className="analisis-results-table__incidents">
                        {incidents.map((incident) => {
                          const sourceLabel = INCIDENCIA_LABELS[incident.code] ?? incident.code;
                          const label = incidenceLabels[sourceLabel] ?? sourceLabel;
                          const tooltipContent = (
                            <>
                              <p className="tooltip-surface__row">
                                <time dateTime={incident.date}>{formatShortDate(incident.date, locale)}</time>
                              </p>
                              <p className="tooltip-surface__row">{label}</p>
                            </>
                          );

                          return (
                            <li key={incident.key}>
                              <Tooltip content={tooltipContent}>
                                <Badge
                                  variant={getIncidenceBadgeVariant(incident.code)}
                                  size="compact"
                                  className="analisis-results-table__incident-chip"
                                  role="img"
                                  tabIndex={0}
                                  aria-label={`${label}, ${formatShortDate(incident.date, locale)}`}
                                >
                                  {incident.code}
                                </Badge>
                              </Tooltip>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span>{copy.noIncidents}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
