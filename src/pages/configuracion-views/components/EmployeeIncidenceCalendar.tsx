import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { INCIDENCIA_LABELS, NON_INCIDENT_CODES } from '@/components/reporte-diario/constants';
import { daysInMonth } from '@/components/reporte-diario/helpers';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { getConfiguracionCopy } from '../configuracion-translations';

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

function describeCalendarCode(code: string | undefined, noRecord: string) {
  if (!code || code === '-' || code === 'X') return noRecord;
  return INCIDENCIA_LABELS[code] || code;
}

function formatCalendarMonth(month: string, locale: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(year, monthNumber - 1, 1)));
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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).analysis;
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const incidenceLabels: Readonly<Record<string, string>> = copy.incidenceLabels;
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
  const selectedMonthIndex = availableReports.findIndex(
    ({ report }) => report.mes === selectedMonth,
  );
  const previousMonth = availableReports[selectedMonthIndex + 1]?.report.mes;
  const nextMonth = selectedMonthIndex > 0
    ? availableReports[selectedMonthIndex - 1]?.report.mes
    : undefined;
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
          <h4 id={titleId} className="config-card__section-title type-body-strong text-muted">
            {copy.incidenceCalendar}
          </h4>
          {selectedEntry && (
            <p
              className="config-calendar-summary type-body-md text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {incidentCount} {incidentCount === 1 ? copy.incidence : copy.incidences} {copy.in} {formatCalendarMonth(selectedMonth, locale)}
            </p>
          )}
        </div>

        {availableReports.length > 0 && (
          <div className="config-calendar-month-field">
            <div className="config-calendar-month-nav">
              <button
                type="button"
                className="btn-icon config-calendar-month-nav__button"
                onClick={() => previousMonth && setRequestedMonth(previousMonth)}
                disabled={!previousMonth}
                aria-label={previousMonth
                  ? `${copy.previousMonth}: ${formatCalendarMonth(previousMonth, locale)}`
                  : copy.noPreviousMonth}
              >
                <ArrowLeft size="var(--icon-size-sm)" aria-hidden="true" />
              </button>
              <CustomSelect
                id={selectId}
                aria-label={copy.incidenceCalendarMonth}
                value={selectedMonth}
                onChange={setRequestedMonth}
                options={availableReports.map(({ report }) => ({
                  value: report.mes,
                  label: formatCalendarMonth(report.mes, locale),
                }))}
                showPlaceholderOption={false}
              />
              <button
                type="button"
                className="btn-icon config-calendar-month-nav__button"
                onClick={() => nextMonth && setRequestedMonth(nextMonth)}
                disabled={!nextMonth}
                aria-label={nextMonth
                  ? `${copy.nextMonth}: ${formatCalendarMonth(nextMonth, locale)}`
                  : copy.noNextMonth}
              >
                <ArrowRight size="var(--icon-size-sm)" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <LoadingSkeleton label={copy.loadingCalendar} className="config-calendar-skeleton">
          <div className="config-calendar-skeleton__weekdays" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span className="loading-skeleton__bone config-calendar-skeleton__weekday" key={index} />
            ))}
          </div>
          <div className="config-calendar-skeleton__days" aria-hidden="true">
            {Array.from({ length: 35 }, (_, index) => (
              <span className="loading-skeleton__bone config-calendar-skeleton__day" key={index} />
            ))}
          </div>
        </LoadingSkeleton>
      ) : selectedEntry ? (
        <div className="config-calendar-grid-container">
          <div className="config-calendar-wrapper">
            <div className="config-calendar-header" aria-hidden="true">
              {copy.weekdays.map((weekday) => (
                <abbr key={weekday.full} title={weekday.full} className="config-calendar-header__abbr">
                  {weekday.short}
                </abbr>
              ))}
            </div>

            <ol className="config-calendar" aria-label={`${copy.calendarFor} ${formatCalendarMonth(selectedMonth, locale)} ${copy.for} ${employeeName}`}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <li key={`blank-${index}`} className="config-calendar__day config-calendar__day--blank" aria-hidden="true" />;
                }

                const kind = getCalendarDayKind(day.code);
                const sourceDescription = describeCalendarCode(day.code, copy.noRecord);
                const description = incidenceLabels[sourceDescription] ?? sourceDescription;
                return (
                  <li
                    key={day.dayKey}
                    className={`config-calendar__day config-calendar__day--${kind}`}
                    aria-label={`${copy.day} ${day.dayNumber}: ${description}`}
                  >
                    <span className="config-calendar__day-number" aria-hidden="true">{day.dayNumber}</span>
                    <span className="config-calendar__day-code" aria-hidden="true">{day.code || '—'}</span>
                  </li>
                );
              })}
            </ol>

            <div className="config-calendar-legend" aria-label={copy.calendarLegend}>
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--attendance" aria-hidden="true" />
                {copy.attendance}
              </span>
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--incident" aria-hidden="true" />
                {copy.incident}
              </span>
              <span className="config-calendar-legend__item">
                <span className="config-calendar-legend__swatch config-calendar-legend__swatch--rest" aria-hidden="true" />
                {copy.restOrLeave}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="config-calendar-empty type-body-md text-muted" role="status">
          {copy.noReports}
        </p>
      )}
    </section>
  );
}
