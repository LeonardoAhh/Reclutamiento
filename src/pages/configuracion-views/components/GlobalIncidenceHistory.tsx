import { useMemo } from 'react';
import {
  INCIDENCIA_LABELS,
  NON_INCIDENT_CODES,
} from '@/components/reporte-diario/constants';
import { formatMes } from '@/components/reporte-diario/helpers';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { toTitleCase } from '@/lib/utils';
import { findEmployeeReportRow } from './EmployeeIncidenceCalendar';

interface GlobalIncidenceHistoryProps {
  employeeNumber: string;
  allReports: ReporteDiarioRecord[];
  titleId: string;
}

export function GlobalIncidenceHistory({
  employeeNumber,
  allReports,
  titleId,
}: GlobalIncidenceHistoryProps) {
  const history = useMemo(() => {
    if (!allReports || !allReports.length) return [];
    const months: {
      mes: string;
      incidents: Record<string, { count: number; days: string[] }>;
    }[] = [];
    const sortedReports = [...allReports].sort((first, second) =>
      second.mes.localeCompare(first.mes),
    );

    for (const report of sortedReports) {
      const row = findEmployeeReportRow(report, employeeNumber);
      if (!row) continue;

      const incidents = Object.entries(row.days)
        .filter(([, code]) => code && !NON_INCIDENT_CODES.has(code))
        .reduce<Record<string, { count: number; days: string[] }>>(
          (accumulator, [day, code]) => {
            const label = INCIDENCIA_LABELS[code] || code;
            if (!accumulator[label]) {
              accumulator[label] = { count: 0, days: [] };
            }
            accumulator[label].count += 1;
            accumulator[label].days.push(Number(day).toString());
            return accumulator;
          },
          {},
        );

      if (Object.keys(incidents).length > 0) {
        months.push({ mes: report.mes, incidents });
      }
    }

    return months;
  }, [allReports, employeeNumber]);

  const totalIncidents = history.reduce(
    (total, month) =>
      total +
      Object.values(month.incidents).reduce(
        (monthTotal, incident) => monthTotal + incident.count,
        0,
      ),
    0,
  );

  if (history.length === 0) return null;

  return (
    <section className="config-card__history-section" aria-labelledby={titleId}>
      <header className="config-history__header">
        <div>
          <h4
            id={titleId}
            className="config-history__title type-caption-up text-muted"
          >
            Historial general de incidencias
          </h4>
          <p className="config-history__summary type-body-sm text-muted">
            {history.length} {history.length === 1 ? 'mes' : 'meses'} ·{' '}
            {totalIncidents}{' '}
            {totalIncidents === 1 ? 'incidencia' : 'incidencias'}
          </p>
        </div>
      </header>

      <ul className="config-history__months">
        {history.map((month) => {
          const monthTotal = Object.values(month.incidents).reduce(
            (total, incident) => total + incident.count,
            0,
          );

          return (
            <li key={month.mes} className="config-history__month-item">
              <header className="config-history__month-header">
                <h5 className="config-history__month type-body-sm-strong text-charcoal">
                  {toTitleCase(formatMes(month.mes))}
                </h5>
                <span className="config-history__month-total type-caption-sm text-muted">
                  {monthTotal} {monthTotal === 1 ? 'registro' : 'registros'}
                </span>
              </header>

              <ul className="config-history__incidents">
                {Object.entries(month.incidents).map(([label, info]) => {
                  const daysText =
                    info.days.length === 1
                      ? `Día ${info.days[0]}`
                      : `Días ${info.days.join(', ')}`;

                  return (
                    <li key={label} className="config-incidence-list__item">
                      <span
                        className="config-incidence-list__marker"
                        aria-hidden="true"
                      />
                      <span className="config-incidence-list__content">
                        <span className="config-incidence-list__label">{label}</span>
                        <span className="config-incidence-list__days">{daysText}</span>
                      </span>
                      <span
                        className="config-incidence-list__count"
                        aria-label={`${info.count} ${info.count === 1 ? 'registro' : 'registros'}`}
                      >
                        {info.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
