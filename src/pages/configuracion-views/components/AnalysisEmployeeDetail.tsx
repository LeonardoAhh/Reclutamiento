import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Day as CalendarDay, type DayProps } from '@daypicker/react';
import { enUS, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/Badge';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import { getIncidenceBadgeVariant } from '@/components/reporte-diario/helpers';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { formatShortDate, parseDdMmYyyy } from '@/lib/dates';
import {
  displayValue,
  getEmployeeIncidents,
  getEmployeeRecordedNonIncidentDays,
  type EmployeeSearchResult,
} from '../analisis-helpers';
import { getConfiguracionCopy } from '../configuracion-translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalysisEmployeeDetailProps {
  employee: EmployeeSearchResult;
  reports: ReporteDiarioRecord[];
  reportsLoading: boolean;
  reportsFetched: boolean;
  reportsError: boolean;
  onRetryReports: () => void;
  onBack: () => void;
}

function getValidIsoDate(value: string): string | null {
  const isoDate = parseDdMmYyyy(value);
  if (!isoDate) return null;

  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? isoDate
    : null;
}

function getContractRenewalDate(hireDate: string | null): string | null {
  if (!hireDate) return null;

  const date = new Date(`${hireDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString().slice(0, 10);
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AnalysisEmployeeDetail({
  employee,
  reports,
  reportsLoading,
  reportsFetched,
  reportsError,
  onRetryReports,
  onBack,
}: AnalysisEmployeeDetailProps) {
  const { language } = useLanguage();
  const configurationCopy = getConfiguracionCopy(language);
  const copy = configurationCopy.analysis;
  const incidenceLabels: Readonly<Record<string, string>> = copy.incidenceLabels;
  const indicatorCopy = configurationCopy.indicators;
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const employeeName = employee.nombre.trim() ? displayValue(employee.nombre) : copy.noInformation;
  const employeeNameButtonRef = useRef<HTMLButtonElement>(null);
  const validHireDate = getValidIsoDate(employee.fecha_ingreso);
  const renewalDate = getContractRenewalDate(validHireDate);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = month
    .toLocaleDateString(locale, { month: 'short', year: 'numeric' })
    .replace(/^\p{L}/u, (initial) => initial.toLocaleUpperCase(locale));
  const reportsReady = reportsFetched && !reportsLoading && !reportsError;
  const navigateMonth = useCallback((offset: number) => {
    setMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  }, []);
  const incidents = useMemo(
    () => getEmployeeIncidents(employee.num_empleado, reports),
    [employee.num_empleado, reports],
  );
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const [todayKey] = useState(() => getDateKey(new Date()));
  const recordedNonIncidentDays = useMemo(
    () => getEmployeeRecordedNonIncidentDays(employee.num_empleado, monthKey, reports),
    [employee.num_empleado, monthKey, reports],
  );
  const incidentCodesByDate = useMemo(() => {
    const codesByDate = new Map<string, string[]>();
    for (const incident of incidents) {
      if (!incident.date.startsWith(`${monthKey}-`)) continue;
      const codes = codesByDate.get(incident.date) ?? [];
      if (!codes.includes(incident.code)) codes.push(incident.code);
      codesByDate.set(incident.date, codes);
    }
    return codesByDate;
  }, [incidents, monthKey]);
  const incidentLegend = useMemo(() => {
    const codes = new Set(Array.from(incidentCodesByDate.values()).flat());
    return Array.from(codes, (code) => {
      const sourceLabel = INCIDENCIA_LABELS[code] ?? code;
      return { code, label: incidenceLabels[sourceLabel] ?? sourceLabel };
    }).sort((first, second) => first.code.localeCompare(second.code));
  }, [incidenceLabels, incidentCodesByDate]);
  const hasVisibleRecordedDay = Array.from(recordedNonIncidentDays.keys()).some(
    (dateKey) => dateKey <= todayKey && !incidentCodesByDate.has(dateKey),
  );
  const recordedLegendLabel = incidenceLabels['Sin incidencia'] ?? 'Sin incidencia';
  const IncidentDayCell = useCallback(
    function IncidentDay({ day, modifiers, children, ...cellProps }: DayProps) {
      const dateKey = getDateKey(day.date);
      const codes = incidentCodesByDate.get(dateKey) ?? [];
      const recordedCode = codes.length === 0 && dateKey <= todayKey ? recordedNonIncidentDays.get(dateKey) : undefined;
      const recordedSourceLabel = recordedCode ? INCIDENCIA_LABELS[recordedCode] : undefined;
      const recordedLabel = recordedSourceLabel
        ? (incidenceLabels[recordedSourceLabel] ?? recordedSourceLabel)
        : undefined;
      const incidenceDetails = codes.map((code) => {
        const sourceLabel = INCIDENCIA_LABELS[code] ?? code;
        const label = incidenceLabels[sourceLabel] ?? sourceLabel;
        return { code, label };
      });
      const dateLabel = day.date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return (
        <CalendarDay
          {...cellProps}
          day={day}
          modifiers={modifiers}
          aria-label={[
            dateLabel,
            ...incidenceDetails.map(({ label, code }) => `${label} (${code})`),
            ...(recordedLabel ? [recordedLabel] : []),
          ].join(', ')}
        >
          <span
            className={`analysis-employee-calendar__day-content${recordedLabel ? ' analysis-employee-calendar__day-content--recorded' : ''}`}
            title={recordedLabel}
          >
            <span className="analysis-employee-calendar__day-number type-body-md">{children}</span>
            {recordedLabel && <span className="analysis-employee-calendar__recorded-marker" aria-hidden="true" />}
            {incidenceDetails.map(({ code, label }) => (
              <Badge
                key={code}
                variant={getIncidenceBadgeVariant(code)}
                size="compact"
                className="analysis-employee-calendar__code"
                title={label}
                aria-hidden="true"
              >
                {code}
              </Badge>
            ))}
          </span>
        </CalendarDay>
      );
    },
    [incidenceLabels, incidentCodesByDate, locale, recordedNonIncidentDays, todayKey],
  );
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => employeeNameButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="analysis-employee-detail" aria-labelledby="analysis-employee-detail-title">
      <header className="analysis-employee-detail__header">
        <h2
          id="analysis-employee-detail-title"
          className="analysis-employee-detail__title type-heading-sm"
          aria-label={employeeName}
        >
          <button
            ref={employeeNameButtonRef}
            type="button"
            className="btn-text analysis-employee-detail__name-back"
            onClick={onBack}
            aria-label={`${copy.backToResults}: ${employeeName}`}
          >
            {employeeName}
          </button>
        </h2>
        {reportsReady && (
          <div className="analysis-employee-calendar__period" role="group" aria-label={copy.calendarTitle}>
            <button
              type="button"
              className="btn-icon"
              aria-label={indicatorCopy.previousMonth}
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft size="var(--icon-size-sm)" aria-hidden="true" />
            </button>
            <time className="type-body-strong" dateTime={monthKey} aria-live="polite">
              {monthLabel}
            </time>
            <button
              type="button"
              className="btn-icon"
              aria-label={indicatorCopy.nextMonth}
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
            </button>
          </div>
        )}
      </header>
      <dl className="analysis-employee-detail__fields">
        <div className="analysis-employee-detail__field">
          <dt className="type-caption-up text-muted">{copy.number}</dt>
          <dd className="type-body-md">{employee.num_empleado.trim() ? employee.num_empleado : copy.noInformation}</dd>
        </div>
        <div className="analysis-employee-detail__field">
          <dt className="type-caption-up text-muted">{copy.hireDate}</dt>
          <dd className="type-body-md">
            {validHireDate ? (
              <time dateTime={validHireDate}>{formatShortDate(validHireDate, locale)}</time>
            ) : (
              copy.noInformation
            )}
          </dd>
        </div>
        <div className="analysis-employee-detail__field">
          <dt className="type-caption-up text-muted">{copy.position}</dt>
          <dd className="type-body-md">
            {employee.puesto.trim() ? displayValue(employee.puesto) : copy.noInformation}
          </dd>
        </div>
        <div className="analysis-employee-detail__field">
          <dt className="type-caption-up text-muted">{copy.contractRenewalDate}</dt>
          <dd className="type-body-md">{renewalDate ? formatShortDate(renewalDate, locale) : copy.noInformation}</dd>
        </div>
      </dl>
      <section className="analysis-employee-calendar" aria-labelledby="analysis-employee-calendar-title">
        <h3 id="analysis-employee-calendar-title" className="sr-only">
          {copy.calendarTitle}
        </h3>
        {reportsError ? (
          <p className="config-incidence-error" role="alert">
            {copy.incidentsLoadError}{' '}
            <ButtonUtility type="button" disabled={reportsLoading} onClick={onRetryReports}>
              {copy.retryIncidents}
            </ButtonUtility>
          </p>
        ) : reportsLoading || !reportsFetched ? (
          <p role="status" aria-live="polite">
            {copy.loadingIncidents}
          </p>
        ) : (
          <>
            <Calendar
              className="analysis-employee-calendar__grid"
              month={month}
              onMonthChange={setMonth}
              locale={language === 'en' ? enUS : es}
              showOutsideDays={false}
              components={{ Day: IncidentDayCell }}
            />
            {(incidentLegend.length > 0 || hasVisibleRecordedDay) && (
              <dl className="analysis-employee-calendar__legend type-body-md">
                {hasVisibleRecordedDay && (
                  <div className="analysis-employee-calendar__legend-item">
                    <dt>
                      <span className="analysis-employee-calendar__recorded-marker" aria-hidden="true" />
                      <span className="sr-only">{recordedLegendLabel}</span>
                    </dt>
                    <dd>{recordedLegendLabel}</dd>
                  </div>
                )}
                {incidentLegend.map(({ code, label }) => (
                  <div className="analysis-employee-calendar__legend-item" key={code}>
                    <dt className="type-caption-up">{code}</dt>
                    <dd>{label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </section>
    </section>
  );
}
