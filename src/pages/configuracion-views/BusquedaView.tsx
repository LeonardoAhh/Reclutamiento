import { useEffect, useMemo, useRef, useState } from 'react';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import { formatMes } from '@/components/reporte-diario/helpers';
import type { ReporteRow } from '@/components/reporte-diario/types';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import {
  useReporteDiario,
  type ReporteDiarioRecord,
  type ReporteDiarioSummary,
} from '@/hooks/useReporteDiario';
import { useBajas } from '@/hooks/useBajas';
import { formatReadableDate } from '@/lib/dates';
import { toTitleCase } from '@/lib/utils';
import { Search, CircleUser, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import '../Configuracion.css';

const NON_INCIDENT_CODES = new Set(["-", "X", "A", "D", "DF", "B"]);

const STICKER_TONES = 5;

function getStickerTone(numEmpleado: string) {
  const numVal = parseInt(numEmpleado.replace(/\D/g, '') || '0', 10);
  return numVal % STICKER_TONES;
}

function displayValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text ? toTitleCase(text) : 'Sin información';
}


function describeCalendarCode(code?: string) {
  if (!code || code === '-' || code === 'X') return 'Sin registro';
  if (code === 'A') return 'Asistencia';
  if (code === 'D' || code === 'DF') return 'Descanso';
  if (code === 'B') return 'Baja';
  return INCIDENCIA_LABELS[code] || code;
}

function MiniCalendar({ days, mesStr }: { days: Record<string, string> | undefined, mesStr: string }) {
  if (!mesStr) return null;
  const [yearStr, monthStr] = mesStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: startOffset }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = String(i + 1).padStart(2, '0');
    return { dayStr, code: days?.[dayStr] };
  });

  const weekdays = [
    { short: 'L', full: 'Lunes' },
    { short: 'M', full: 'Martes' },
    { short: 'M', full: 'Miércoles' },
    { short: 'J', full: 'Jueves' },
    { short: 'V', full: 'Viernes' },
    { short: 'S', full: 'Sábado' },
    { short: 'D', full: 'Domingo' },
  ];

  return (
    <div className="config-calendar-wrapper">
      <span className="sr-only">Calendario de asistencia e incidencias de {formatMes(mesStr)}.</span>
      <div className="config-calendar-header" aria-hidden="true">
        {weekdays.map((d, i) => (
          <abbr key={i} title={d.full} className="config-calendar-header__abbr">
            {d.short}
          </abbr>
        ))}
      </div>
      <div className="config-calendar" role="list" aria-label={`Calendario de ${formatMes(mesStr)}`}>
        {blanks.map(b => <div key={`blank-${b}`} className="config-calendar__day config-calendar__day--blank" role="presentation" />)}
        {monthDays.map(d => {
          const hasCode = !!d.code;
          const isAttendance = d.code === 'A';
          const isIncident = hasCode && !NON_INCIDENT_CODES.has(d.code as string);

          let className = "config-calendar__day";
          if (isIncident) className += " config-calendar__day--incident";
          else if (isAttendance) className += " config-calendar__day--active";

          return (
            <div
              key={d.dayStr}
              className={className}
              data-day={d.dayStr}
              role="listitem"
              title={`${d.dayStr}: ${describeCalendarCode(d.code)}`}
              aria-label={`Día ${Number(d.dayStr)}: ${describeCalendarCode(d.code)}`}
            />
          );
        })}
      </div>
      <div className="config-calendar-legend">
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--active" />
          Asistencia
        </span>
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--incident" />
          Incidencia
        </span>
      </div>
    </div>
  );
}

export function BusquedaView() {
  const { loading: authLoading } = useAuth();
  const { employees, loading: employeesLoading, error: employeesError } = useSupabaseData();
  const { bajas, loading: bajasLoading } = useBajas();
  const { fetchByMes, fetchSummaries } = useReporteDiario();

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [summaries, setSummaries] = useState<ReporteDiarioSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [selectedMes, setSelectedMes] = useState<string>('');
  const [currentReport, setCurrentReport] = useState<ReporteDiarioRecord | null>(null);

  useEffect(() => {
    let active = true;
    fetchSummaries().then(data => {
      if (!active) return;
      setSummaries(data);
      if (data.length > 0) {
        setSelectedMes(data[0].mes);
      }
    }).finally(() => {
      if (active) setSummariesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchSummaries]);

  useEffect(() => {
    if (!selectedMes) {
      setCurrentReport(null);
      setReportError('');
      setReportLoading(false);
      return;
    }
    let active = true;
    setCurrentReport(null);
    setReportError('');
    setReportLoading(true);
    fetchByMes(selectedMes).then((report) => {
      if (!active) return;
      setCurrentReport(report);
      if (!report) setReportError('No fue posible cargar las incidencias del mes seleccionado.');
    }).catch(() => {
      if (active) setReportError('No fue posible cargar las incidencias del mes seleccionado.');
    }).finally(() => {
      if (active) setReportLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedMes, fetchByMes]);

  const reportRows = useMemo(() => {
    if (!currentReport) return [];
    return currentReport.data.filter((row): row is ReporteRow => {
      if (!row || typeof row !== 'object') return false;
      const candidate = row as Partial<ReporteRow>;
      return typeof candidate.numero_empleado === 'string' && Boolean(candidate.days && typeof candidate.days === 'object');
    });
  }, [currentReport]);

  const employeeDaysByNumber = useMemo(() => {
    return new Map(reportRows.map((row) => [row.numero_empleado, row.days]));
  }, [reportRows]);

  const searchQuery = searchTerm.trim();

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase('es');
    if (query.length < 2) return [];

    const activeMatches = employees.filter((employee) => {
      return employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
             employee.nombre.toLocaleLowerCase('es').includes(query);
    }).map(e => ({ ...e, isBaja: false }));

    const bajaMatches = bajas.filter((employee) => {
      return employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
             employee.nombre.toLocaleLowerCase('es').includes(query);
    }).map(e => ({ ...e, isBaja: true }));

    return [...activeMatches, ...bajaMatches].slice(0, 10);
  }, [searchQuery, employees, bajas]);

  if (authLoading || employeesLoading || bajasLoading) {
    return (
      <section className="busqueda-view" aria-busy="true">
        <header className="config-page__header">
          <Skeleton variant="text" width="var(--skeleton-title-width)" height="var(--type-heading-lg-size)" />
          <Skeleton variant="text" width="60%" height="var(--type-body-md-size)" className="mt-sm" />
        </header>

        <div className="busqueda-skeleton" aria-hidden="true">
           <Skeleton variant="rect" width="100%" height="var(--touch-target-min)" radius="var(--rounded-md)" />
           <Skeleton variant="rect" width="100%" height="var(--skeleton-card-height)" radius="var(--rounded-md)" />
        </div>
        <span className="sr-only" role="status" aria-live="polite">Cargando colaboradores…</span>
      </section>
    );
  }

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const showHelperText = searchQuery.length === 1;

  return (
    <section className="busqueda-view config-page__content" aria-labelledby="busqueda-title">
      <div className="config-page__header-container">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <header className="config-page__header">
            <h2 id="busqueda-title" className="config-page__title">Búsqueda global</h2>
          </header>

          {employeesError && (
            <p className="config-search-error type-body-sm mt-sm" role="alert">
              No fue posible actualizar la lista de colaboradores. Se muestran los datos disponibles.
            </p>
          )}
        </div>

        <section className="config-page__toolbar" aria-label="Herramientas de búsqueda">
          <div className="form-group config-search">
            <label htmlFor="config-search-input" className="sr-only">
              Buscar empleado
            </label>
            <div className="config-search__wrapper">
              <Search size={18} className="config-search__icon text-muted" aria-hidden="true" />
              <input
                id="config-search-input"
                ref={searchInputRef}
                type="search"
                inputMode="search"
                placeholder="Buscar empleado por nombre o número…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                aria-controls="config-search-results"
                aria-describedby={showHelperText ? "config-search-hint" : undefined}
              />
              {searchTerm.length > 0 && (
                <button
                  type="button"
                  className="btn-icon config-search__clear"
                  onClick={handleClearSearch}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            {showHelperText && (
              <p id="config-search-hint" className="config-search__hint type-caption-sm text-muted-soft">
                Escribe al menos 2 caracteres para buscar.
              </p>
            )}
          </div>
        </section>
      </div>

      <section
        id="config-search-results"
        className="config-page__content"
        aria-label="Resultados de búsqueda"
        aria-busy={summariesLoading || reportLoading}
      >
        {(summariesLoading || reportLoading) && (
          <span className="sr-only" role="status" aria-live="polite">
            {summariesLoading ? 'Cargando reportes disponibles…' : 'Actualizando incidencias del mes seleccionado…'}
          </span>
        )}
        {searchQuery.length < 2 ? (
          <div className="animated-empty-state">
            <div className="animated-empty-state__icon">
              <Search aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">Listo para buscar</div>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="config-results-wrapper">
            <h3 className="sr-only">Resultados de búsqueda</h3>
            <p
              className="config-results__count type-caption-sm text-muted"
              role="status"
              aria-live="polite"
            >
              {filteredEmployees.length} resultado{filteredEmployees.length !== 1 ? 's' : ''} para “{searchQuery}”
            </p>

            <div className="config-results">
              {filteredEmployees.map(emp => {
                const employeeName = displayValue(emp.nombre);
                const employeeNumber = displayValue(emp.num_empleado);
                const stickerTone = getStickerTone(employeeNumber);
                const employeeDomId = employeeNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
                const monthSelectId = `config-month-select-${employeeDomId}`;
                const employeeTitleId = `employee-card-title-${employeeDomId}`;

                return (
                  <article key={employeeNumber} className="config-card" aria-labelledby={employeeTitleId}>
                    <header className="config-card__header">
                      <div
                        className={`config-card__avatar config-card__avatar--tone-${stickerTone}`}
                        aria-hidden="true"
                      >
                        <CircleUser size="1em" aria-hidden="true" />
                      </div>
                      <div className="config-card__title-group">
                        <h3 id={employeeTitleId} className="type-heading-sm text-ink" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span className="text-muted-soft" style={{ fontWeight: 'normal' }}>#{employeeNumber}</span>
                          <span>{employeeName}</span>
                          {emp.isBaja && <Badge variant="error">Baja</Badge>}
                        </h3>
                      </div>
                    </header>

                    <div className="config-card__body">
                      <dl className="config-card__properties">
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-body-sm text-muted">Puesto</dt>
                          <dd className="notion-prop__value type-body-sm-strong text-charcoal">{displayValue(emp.puesto)}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-body-sm text-muted">Departamento</dt>
                          <dd className="notion-prop__value type-body-sm-strong text-charcoal">{displayValue(emp.area)}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-body-sm text-muted">Sección</dt>
                          <dd className="notion-prop__value type-body-sm-strong text-charcoal">{displayValue(emp.seccion)}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-body-sm text-muted">Fecha de ingreso</dt>
                          <dd className="notion-prop__value type-body-sm-strong text-charcoal">{toTitleCase(formatReadableDate(emp.fecha_ingreso))}</dd>
                        </div>
                        {emp.isBaja && 'fecha_baja' in emp && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Fecha de baja</dt>
                            <dd className="notion-prop__value type-body-sm-strong text-charcoal">{toTitleCase(formatReadableDate((emp as any).fecha_baja))}</dd>
                          </div>
                        )}
                        {emp.isBaja && 'motivo_baja' in emp && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Motivo de baja</dt>
                            <dd className="notion-prop__value type-body-sm-strong text-charcoal" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String((emp as any).motivo_baja || '')}>
                              {displayValue((emp as any).motivo_baja)}
                            </dd>
                          </div>
                        )}
                        {!(emp.isBaja && !emp.turno) && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Turno</dt>
                            <dd className="notion-prop__value">
                              {emp.turno ? (
                                <Badge variant="teal">{emp.turno}</Badge>
                              ) : (
                                <span className="type-body-sm-strong text-muted">N/A</span>
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>

                      <aside className="config-card__calendar-section" aria-label={`Incidencias de ${employeeName}`}>
                        <div className="config-calendar-header-actions">
                          <span className="notion-prop__label type-caption-up text-muted">Incidencias</span>

                          {summariesLoading ? (
                            <span className="type-caption-sm text-muted" role="status">Cargando reportes…</span>
                          ) : summaries.length > 1 ? (
                            <>
                              <label htmlFor={monthSelectId} className="sr-only">
                                Seleccionar mes para {employeeName}
                              </label>
                              <select
                                id={monthSelectId}
                                value={selectedMes}
                                onChange={e => setSelectedMes(e.target.value)}
                                className="config-month-select"
                              >
                                {summaries.map(summary => (
                                  <option key={summary.mes} value={summary.mes}>{formatMes(summary.mes)}</option>
                                ))}
                              </select>
                            </>
                          ) : summaries.length === 1 ? (
                            <span className="type-caption-sm text-muted">{formatMes(selectedMes)}</span>
                          ) : (
                            <span className="type-caption-sm text-muted">Sin reportes</span>
                          )}
                        </div>

                        <div className="config-calendar-layout">
                          {(() => {
                            const empDays = employeeDaysByNumber.get(employeeNumber);

                            if (reportLoading) {
                              return (
                                <div className="config-incidence-loading" role="status" aria-live="polite">
                                  <Skeleton variant="text" width="60%" height="var(--type-caption-sm-size)" />
                                  <Skeleton variant="rect" width="100%" height="var(--skeleton-card-height)" radius="var(--rounded-md)" />
                                  <span className="sr-only">Cargando incidencias de {employeeName}…</span>
                                </div>
                              );
                            }

                            if (reportError) {
                              return (
                                <p className="config-incidence-error type-caption-sm" role="alert">
                                  {reportError}
                                </p>
                              );
                            }

                            const parsedIncidents = Object.entries(empDays || {})
                              .filter(([, code]) => code && !NON_INCIDENT_CODES.has(code as string))
                              .map(([day, code]) => ({
                                day,
                                code: code as string,
                                label: INCIDENCIA_LABELS[code as string] || (code as string),
                              }))
                              .sort((a, b) => parseInt(a.day) - parseInt(b.day));

                            return (
                              <>
                                <div className="config-calendar-details">
                                  {parsedIncidents.length > 0 ? (
                                    <ul className="config-incidence-list">
                                      {parsedIncidents.map(inc => (
                                        <li key={inc.day} className="config-incidence-list__item">
                                          <span className="config-incidence-list__day">{inc.day}</span>
                                          <span className="config-incidence-list__label">{inc.label}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="config-incidence-list--empty">
                                      <span className="type-caption-sm text-muted-soft">Mes sin incidencias registradas.</span>
                                    </div>
                                  )}
                                </div>
                                <div className="config-calendar-grid-container">
                                  <MiniCalendar
                                    mesStr={selectedMes}
                                    days={empDays}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="config-empty" role="status">
            <Search size={32} className="text-muted-soft config-empty__icon" aria-hidden="true" />
            <p className="type-body-md text-muted config-empty__copy">No se encontraron resultados para “{searchQuery}”.</p>
          </div>
        )}
      </section>
    </section>
  );
}
