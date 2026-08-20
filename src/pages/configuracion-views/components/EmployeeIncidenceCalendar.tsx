import { useMemo, useState } from 'react';
import { INCIDENCIA_LABELS, NON_INCIDENT_CODES } from '@/components/reporte-diario/constants';
import { daysInMonth, formatMes } from '@/components/reporte-diario/helpers';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';

const WEEKDAYS = [
  { short: 'L', full: 'Lunes' },
  { short: 'M', full: 'Martes' },
  { short: 'M', full: 'Miércoles' },
  { short: 'J', full: 'Jueves' },
  { short: 'V', full: 'Viernes' },
  { short: 'S', full: 'Sábado' },
  { short: 'D', full: 'Domingo' },
] as const;

type EmployeeReportRow = {
  numero_empleado: string;
  days: Record<string, string>;
};

type CalendarDayKind = 'attendance' | 'incident' | 'rest' | 'empty';

function normalizeEmployeeNumber(value: string) {
  return String(parseInt(value.replace(/\D/g, '') || '0', 10));
}

function isEmployeeReportRow(value: unknown): value is EmployeeReportRow {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.numero_empleado === 'string' &&
    Boolean(candidate.days && typeof candidate.days === 'object' && !Array.isArray(candidate.days));
}

export function findEmployeeReportRow(report: ReporteDiarioRecord, employeeNumber: string) {
  return report.data.find(
    (candidate): candidate is EmployeeReportRow =>
      isEmployeeReportRow(candidate) &&
      normalizeEmployeeNumber(candidate.numero_empleado) === normalizeEmployeeNumber(employeeNumber),
  );
}

function describeCalendarCode(code?: string) {
  if (!code || code === '-' || code === 'X') return 'Sin registro';
  return INCIDENCIA_LABELS[code] || code;
}

function getCalendarDayKind(code?: string): CalendarDayKind {
  if (!code || code === '-' || code === 'X') return 'empty';
  if (code === 'A') return 'attendance';
  if (NON_INCIDENT_CODES.has(code)) return 'rest';
  return 'incident';
}

function buildCalendarDays(month: string, days: Record<string, string>) {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return [];

  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const mondayFirstOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const blanks = Array.from({ length: mondayFirstOffset }, () => null);
  const monthDays = Array.from({ length: daysInMonth(month) }, (_, index) => {
    const dayNumber = index + 1;
    const dayKey = String(dayNumber).padStart(2, '0');
    return {
      dayNumber,
      dayKey,
      code: days[dayKey],
    };
  });

  return [...blanks, ...monthDays];
}

interface EmployeeIncidenceCalendarProps {
  employeeName: string;
  employeeNumber: string;
  loading: boolean;
  reports: ReporteDiarioRecord[];
  selectId: string;
  titleId: string;
}

export function EmployeeIncidenceCalendar({
  employeeName,
  employeeNumber,
  loading,
  reports,
  selectId,
  titleId,
}: EmployeeIncidenceCalendarProps) {
  const [requestedMonth, setRequestedMonth] = useState('');

  const availableReports = useMemo(() => {
    if (!reports) return [];
    return reports
      .map((report) => ({ report, row: findEmployeeReportRow(report, employeeNumber) }))
      .filter((entry): entry is { report: ReporteDiarioRecord; row: EmployeeReportRow } => Boolean(entry.row))
      .sort((first, second) => second.report.mes.localeCompare(first.report.mes));
  }, [employeeNumber, reports]);

  const selectedEntry = availableReports.find(({ report }) => report.mes === requestedMonth) ?? availableReports[0];
  const selectedMonth = selectedEntry?.report.mes ?? '';
  const calendarDays = useMemo(
    () => selectedEntry ? buildCalendarDays(selectedEntry.report.mes, selectedEntry.row.days) : [],
    [selectedEntry],
  );
  const incidentCount = useMemo(
    () => selectedEntry
      ? Object.values(selectedEntry.row.days).filter((code) => code && !NON_INCIDENT_CODES.has(code)).length
      : 0,
    [selectedEntry],
  );

  return (
    <section className="config-card__calendar-section" aria-labelledby={titleId}>
      <header className="config-calendar-header-actions">
        <div className="config-calendar-heading">
          <h4 id={titleId} className="config-card__section-title type-caption-up text-muted">
            Calendario de incidencias
          </h4>
          {selectedEntry && (
            <p className="config-calendar-summary type-caption-sm text-muted">
              {incidentCount} {incidentCount === 1 ? 'incidencia' : 'incidencias'} en {formatMes(selectedMonth)}
            </p>
          )}
        </div>

        {availableReports.length > 0 && (
          <label className="config-calendar-month-field" htmlFor={selectId}>
            <span className="config-filter-label type-caption-sm text-muted">Mes</span>
            <select
              id={selectId}
              value={selectedMonth}
              onChange={(event) => setRequestedMonth(event.target.value)}
              className="config-month-select"
            >
              {availableReports.map(({ report }) => (
                <option key={report.id} value={report.mes}>{formatMes(report.mes)}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      {loading ? (
        <p className="config-calendar-empty type-body-sm text-muted">
          Cargando calendario…
        </p>
      ) : selectedEntry ? (
        <div className="config-calendar-grid-container">
          <div className="config-calendar-wrapper">
            <div className="config-calendar-header" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <abbr key={weekday.full} title={weekday.full} className="config-calendar-header__abbr">
                  {weekday.short}
                </abbr>
              ))}
            </div>

            <ol className="config-calendar" aria-label={`Calendario de ${formatMes(selectedMonth)} para ${employeeName}`}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <li key={`blank-${index}`} className="config-calendar__day config-calendar__day--blank" aria-hidden="true" />;
                }

                const kind = getCalendarDayKind(day.code);
                const description = describeCalendarCode(day.code);
                return (
                  <li
                    key={day.dayKey}
                    className={`config-calendar__day config-calendar__day--${kind}`}
                    aria-label={`Día ${day.dayNumber}: ${description}`}
                  >
                    <span className="config-calendar__day-number" aria-hidden="true">{day.dayNumber}</span>
                    <span className="config-calendar__day-code" aria-hidden="true">{day.code || '—'}</span>
                  </li>
                );
              })}
            </ol>

            <div className="config-calendar-legend" aria-label="Leyenda del calendario">
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--attendance" aria-hidden="true" />
                Asistencia
              </span>
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--incident" aria-hidden="true" />
                Incidencia
              </span>
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--rest" aria-hidden="true" />
                Descanso o baja
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="config-calendar-empty type-body-sm text-muted" role="status">
          No hay reportes disponibles para este colaborador.
        </p>
      )}
    </section>
  );
}
