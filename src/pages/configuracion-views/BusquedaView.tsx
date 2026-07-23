import { useEffect, useMemo, useRef, useState } from 'react';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import { formatMes } from '@/components/reporte-diario/helpers';

import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import {
  useReporteDiario,
  type ReporteDiarioRecord,
  type ReporteDiarioSummary,
} from '@/hooks/useReporteDiario';
import { useBajas } from '@/hooks/useBajas';
import { formatReadableDate, addDaysToIso, localTodayIso } from '@/lib/dates';
import type { Baja, Employee } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  CircleUser,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Badge, StarliteBadge } from '@/components/ui/Badge';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { Skeleton } from '@/components/ui/Skeleton';
import '../Configuracion.css';

const NON_INCIDENT_CODES = new Set(["-", "X", "A", "D", "DF", "B"]);

const STICKER_TONES = 5;

type EmployeeSearchResult =
  | (Employee & { isBaja: false })
  | (Baja & { isBaja: true });

type ReportEmployeeRow = {
  numero_empleado: string;
  days: Record<string, string>;
};

type SearchStatusFilter = 'all' | 'active' | 'inactive';
type SearchViewMode = 'detail' | 'compact';

const ALL_FILTER_VALUE = 'all';

function normalizeFilterValue(value: string) {
  return value.trim().toLocaleLowerCase('es');
}

function uniqueFilterValues(results: EmployeeSearchResult[], field: 'area' | 'turno') {
  const values = new Map<string, string>();

  for (const result of results) {
    const display = String(result[field] ?? '').trim();
    if (!display) continue;
    const normalized = normalizeFilterValue(display);
    if (!values.has(normalized)) values.set(normalized, displayValue(display));
  }

  return Array.from(values, ([value, label]) => ({ value, label }))
    .sort((first, second) => first.label.localeCompare(second.label, 'es'));
}

function isReportEmployeeRow(value: unknown): value is ReportEmployeeRow {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.numero_empleado === 'string' &&
    Boolean(candidate.days && typeof candidate.days === 'object' && !Array.isArray(candidate.days));
}

function getEmployeeResultId(employee: EmployeeSearchResult) {
  const resultKind = employee.isBaja ? 'baja' : 'activo';
  const identity = employee.id || (employee.isBaja ? employee.fecha_baja : employee.fecha_ingreso);
  const rawId = `${resultKind}-${employee.num_empleado}-${identity}`;
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '-');
}

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

function MiniCalendar({ days, mesStr }: { days: Record<string, string> | undefined; mesStr: string }) {
  if (!mesStr) return null;

  const [yearStr, monthStr] = mesStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  // Guard: mesStr mal formado no debe romper el render
  if (Number.isNaN(year) || Number.isNaN(month)) return null;

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: startOffset }, (_, i) => `blank-${i}`);
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
      <span className="sr-only">
        Calendario de asistencia e incidencias de {formatMes(mesStr)}.
      </span>

      {/* Cabecera (días de la semana) — decorativa, ya descrita por el sr-only de arriba y por cada celda */}
      <div className="config-calendar-header" aria-hidden="true">
        {weekdays.map((d) => (
          <abbr key={d.full} title={d.full} className="config-calendar-header__abbr">
            {d.short}
          </abbr>
        ))}
      </div>

      {/* Cuadrícula de días — <ul>/<li> nativos: estructura de lista válida,
          incluyendo los huecos iniciales como listitem vacíos (nunca role="presentation"
          suelto dentro de role="list", que rompe el conteo de items para el lector de pantalla) */}
      <ul className="config-calendar" aria-label={`Calendario de ${formatMes(mesStr)}`}>
        {blanks.map((key) => (
          <li key={key} className="config-calendar__day config-calendar__day--blank" aria-hidden="true" />
        ))}
        {monthDays.map((d) => {
          const hasCode = !!d.code;
          const isAttendance = d.code === 'A';
          const isIncident = hasCode && !NON_INCIDENT_CODES.has(d.code as string);

          let className = 'config-calendar__day';
          if (isIncident) className += ' config-calendar__day--incident';
          else if (isAttendance) className += ' config-calendar__day--active';

          return (
            <li
              key={d.dayStr}
              className={className}
              data-day={d.dayStr}
              title={`${d.dayStr}: ${describeCalendarCode(d.code)}`}
              aria-label={`Día ${Number(d.dayStr)}: ${describeCalendarCode(d.code)}`}
            />
          );
        })}
      </ul>

      {/* Leyenda inferior */}
      <div className="config-calendar-legend">
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--active" aria-hidden="true" />
          Asistencia
        </span>
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--incident" aria-hidden="true" />
          Incidencia
        </span>
      </div>
    </div>
  );
}

function GlobalIncidenceHistory({
  employeeNumber,
  allReports,
  titleId,
}: {
  employeeNumber: string;
  allReports: ReporteDiarioRecord[];
  titleId: string;
}) {
  const history = useMemo(() => {
    if (!allReports.length) return [];
    const res: { mes: string, incidents: Record<string, { count: number, days: string[] }> }[] = [];
    const sortedReports = [...allReports].sort((a, b) => b.mes.localeCompare(a.mes));

    for (const report of sortedReports) {
      const row = report.data.find(
        (candidate): candidate is ReportEmployeeRow =>
          isReportEmployeeRow(candidate) && candidate.numero_empleado === employeeNumber,
      );
      if (row) {
        const incidents = Object.entries(row.days)
          .filter(([, code]) => code && !NON_INCIDENT_CODES.has(code))
          .reduce((acc, [dayStr, code]) => {
            const label = INCIDENCIA_LABELS[code] || code;
            if (!acc[label]) acc[label] = { count: 0, days: [] };
            acc[label].count += 1;
            acc[label].days.push(Number(dayStr).toString());
            return acc;
          }, {} as Record<string, { count: number, days: string[] }>);

        if (Object.keys(incidents).length > 0) {
          res.push({ mes: report.mes, incidents });
        }
      }
    }
    return res;
  }, [allReports, employeeNumber]);

  const totalIncidents = history.reduce(
    (total, month) => total + Object.values(month.incidents).reduce(
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
          <h4 id={titleId} className="config-history__title type-caption-up text-muted">
            Historial general de incidencias
          </h4>
          <p className="config-history__summary type-body-sm text-muted">
            {history.length} {history.length === 1 ? 'mes' : 'meses'} · {totalIncidents} {totalIncidents === 1 ? 'incidencia' : 'incidencias'}
          </p>
        </div>
      </header>

      <ul className="config-history__months">
        {history.map((h) => {
          const monthTotal = Object.values(h.incidents).reduce(
            (total, incident) => total + incident.count,
            0,
          );

          return (
            <li key={h.mes} className="config-history__month-item">
              <header className="config-history__month-header">
                <h5 className="config-history__month type-body-sm-strong text-charcoal">
                  {toTitleCase(formatMes(h.mes))}
                </h5>
                <span className="config-history__month-total type-caption-sm text-muted">
                  {monthTotal} {monthTotal === 1 ? 'registro' : 'registros'}
                </span>
              </header>

              <ul className="config-history__incidents">
                {Object.entries(h.incidents).map(([label, info]) => {
                  const daysText = info.days.length === 1 ? `Día ${info.days[0]}` : `Días ${info.days.join(', ')}`;
                  return (
                    <li key={label} className="config-incidence-list__item">
                      <span className="config-incidence-list__marker" aria-hidden="true" />
                      <span className="config-incidence-list__content">
                        <span className="config-incidence-list__label">{label}</span>
                        <span className="config-incidence-list__days">{daysText}</span>
                      </span>
                      <span className="config-incidence-list__count" aria-label={`${info.count} ${info.count === 1 ? 'registro' : 'registros'}`}>
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

export function BusquedaView() {
  const { loading: authLoading } = useAuth();
  const { employees, loading: employeesLoading, error: employeesError } = useSupabaseData();
  const { bajas, loading: bajasLoading } = useBajas();
  const { fetchByMes, fetchSummaries, fetchByMesList } = useReporteDiario();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SearchStatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState(ALL_FILTER_VALUE);
  const [shiftFilter, setShiftFilter] = useState(ALL_FILTER_VALUE);
  const [viewMode, setViewMode] = useState<SearchViewMode>('detail');
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(() => new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [summaries, setSummaries] = useState<ReporteDiarioSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [allReports, setAllReports] = useState<ReporteDiarioRecord[]>([]);
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
        fetchByMesList(data.map(s => s.mes)).then(reps => {
          if (active) setAllReports(reps);
        });
      }
    }).finally(() => {
      if (active) setSummariesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchSummaries, fetchByMesList]);

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
    return currentReport.data.filter(isReportEmployeeRow);
  }, [currentReport]);

  const employeeDaysByNumber = useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    for (const row of reportRows) {
      map.set(row.numero_empleado, row.days);
    }
    return map;
  }, [reportRows]);

  const searchQuery = searchTerm.trim();

  const searchMatches = useMemo<EmployeeSearchResult[]>(() => {
    const query = searchQuery.toLocaleLowerCase('es');
    if (query.length < 2) return [];

    const activeMatches: EmployeeSearchResult[] = employees.filter((employee) => {
      return employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
             employee.nombre.toLocaleLowerCase('es').includes(query);
    }).map(employee => ({ ...employee, isBaja: false as const }));

    const bajaMatches: EmployeeSearchResult[] = bajas.filter((employee) => {
      return employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
             employee.nombre.toLocaleLowerCase('es').includes(query);
    }).map(employee => ({ ...employee, isBaja: true as const }));

    return [...activeMatches, ...bajaMatches].slice(0, 10);
  }, [searchQuery, employees, bajas]);

  const departmentOptions = useMemo(
    () => uniqueFilterValues(searchMatches, 'area'),
    [searchMatches],
  );
  const shiftOptions = useMemo(
    () => uniqueFilterValues(searchMatches, 'turno'),
    [searchMatches],
  );

  const filteredEmployees = useMemo(() => {
    return searchMatches.filter((employee) => {
      if (statusFilter === 'active' && employee.isBaja) return false;
      if (statusFilter === 'inactive' && !employee.isBaja) return false;
      if (
        departmentFilter !== ALL_FILTER_VALUE &&
        normalizeFilterValue(employee.area) !== departmentFilter
      ) return false;
      if (
        shiftFilter !== ALL_FILTER_VALUE &&
        normalizeFilterValue(employee.turno ?? '') !== shiftFilter
      ) return false;
      return true;
    });
  }, [searchMatches, statusFilter, departmentFilter, shiftFilter]);

  const hasActiveFilters = statusFilter !== 'all' ||
    departmentFilter !== ALL_FILTER_VALUE ||
    shiftFilter !== ALL_FILTER_VALUE;
  const canUseCompactView = searchMatches.length > 1;

  useEffect(() => {
    setStatusFilter('all');
    setDepartmentFilter(ALL_FILTER_VALUE);
    setShiftFilter(ALL_FILTER_VALUE);
    setExpandedResultIds(new Set<string>());
  }, [searchQuery]);

  useEffect(() => {
    if (!canUseCompactView && viewMode === 'compact') setViewMode('detail');
  }, [canUseCompactView, viewMode]);

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

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter(ALL_FILTER_VALUE);
    setShiftFilter(ALL_FILTER_VALUE);
  };

  const handleViewModeChange = (mode: SearchViewMode) => {
    setViewMode(mode);
    if (mode === 'detail') setExpandedResultIds(new Set<string>());
  };

  const handleToggleCompactResult = (resultId: string) => {
    setExpandedResultIds((current) => {
      const next = new Set(current);
      if (next.has(resultId)) next.delete(resultId);
      else next.add(resultId);
      return next;
    });
  };

  const showHelperText = searchQuery.length === 1;

  return (
    <section className="busqueda-view config-page__content" aria-labelledby="busqueda-title">
      <div className="config-page__header-container">
        <div className="config-page__heading-group">
          <header className="config-page__header">
            <h2 id="busqueda-title" className="config-page__title">Búsqueda global</h2>
          </header>

          {employeesError && (
            <p className="config-search-error type-body-sm mt-sm" role="alert">
              No fue posible actualizar la lista de colaboradores. Se muestran los datos disponibles.
            </p>
          )}
        </div>

        <section className="config-page__toolbar" role="search" aria-label="Buscar colaboradores">
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
          <div className="animated-empty-state busqueda-view__empty">
            <div className="animated-empty-state__icon">
              <Search aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">Busca un colaborador</div>
            <p className="animated-empty-state__subtitle">Consulta su información laboral, asistencia e historial de incidencias.</p>
          </div>
        ) : searchMatches.length > 0 ? (
          <div className="config-results-wrapper">
            <h3 className="sr-only">Resultados de búsqueda</h3>

            <section className="config-results-controls" aria-label="Filtros y vista de resultados">
              <div className="config-results-controls__heading">
                <SlidersHorizontal aria-hidden="true" />
                <span className="type-body-sm-strong text-charcoal">Filtrar resultados</span>
              </div>

              <div className="config-results-controls__filters">
                <fieldset className="config-filter-group">
                  <legend className="config-filter-label type-caption-sm text-muted">Estado</legend>
                  <div className="config-segmented-control">
                    {([
                      ['all', 'Todos'],
                      ['active', 'Activos'],
                      ['inactive', 'Bajas'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`config-segmented-control__button${statusFilter === value ? ' is-active' : ''}`}
                        onClick={() => setStatusFilter(value)}
                        aria-pressed={statusFilter === value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="config-filter-field">
                  <span className="config-filter-label type-caption-sm text-muted">Departamento</span>
                  <select
                    value={departmentFilter}
                    onChange={(event) => setDepartmentFilter(event.target.value)}
                    className="config-filter-select"
                  >
                    <option value={ALL_FILTER_VALUE}>Todos</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="config-filter-field">
                  <span className="config-filter-label type-caption-sm text-muted">Turno</span>
                  <select
                    value={shiftFilter}
                    onChange={(event) => setShiftFilter(event.target.value)}
                    className="config-filter-select"
                  >
                    <option value={ALL_FILTER_VALUE}>Todos</option>
                    {shiftOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                {hasActiveFilters && (
                  <ButtonUtility
                    type="button"
                    className="config-filter-reset"
                    icon={<RotateCcw aria-hidden="true" />}
                    onClick={handleClearFilters}
                  >
                    Limpiar
                  </ButtonUtility>
                )}
              </div>

              {canUseCompactView && (
                <div className="config-view-switch" role="group" aria-label="Vista de resultados">
                  <button
                    type="button"
                    className={`config-view-switch__button${viewMode === 'detail' ? ' is-active' : ''}`}
                    onClick={() => handleViewModeChange('detail')}
                    aria-pressed={viewMode === 'detail'}
                  >
                    <List aria-hidden="true" />
                    Detallada
                  </button>
                  <button
                    type="button"
                    className={`config-view-switch__button${viewMode === 'compact' ? ' is-active' : ''}`}
                    onClick={() => handleViewModeChange('compact')}
                    aria-pressed={viewMode === 'compact'}
                  >
                    <LayoutGrid aria-hidden="true" />
                    Compacta
                  </button>
                </div>
              )}
            </section>

            <p className="config-results__count type-caption-sm text-muted" aria-live="polite">
              {hasActiveFilters
                ? `${filteredEmployees.length} de ${searchMatches.length} resultados para “${searchQuery}”`
                : `${searchMatches.length} resultado${searchMatches.length !== 1 ? 's' : ''} para “${searchQuery}”`}
            </p>

            <div className={`config-results${viewMode === 'compact' ? ' config-results--compact' : ''}`}>
              {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => {
                const employeeName = displayValue(emp.nombre);
                const employeeNumber = displayValue(emp.num_empleado);
                const stickerTone = getStickerTone(employeeNumber);
                const employeeDomId = getEmployeeResultId(emp);
                const monthSelectId = `config-month-select-${employeeDomId}`;
                const employeeTitleId = `employee-card-title-${employeeDomId}`;
                const isCompactResult = viewMode === 'compact';
                const isExpanded = expandedResultIds.has(employeeDomId);
                const compactDetailsId = `compact-details-${employeeDomId}`;

                return (
                  <article
                    key={employeeDomId}
                    className={`config-card${isCompactResult ? ' config-card--compact' : ''}${isExpanded ? ' is-expanded' : ''}`}
                    aria-labelledby={employeeTitleId}
                  >
                    <header className="config-card__header">
                      <div
                        className={`config-card__avatar config-card__avatar--tone-${stickerTone}`}
                        aria-hidden="true"
                      >
                        <CircleUser size="1em" aria-hidden="true" />
                      </div>
                      <div className="config-card__title-group">
                        <h3 id={employeeTitleId} className="config-card__employee-title type-heading-sm text-ink">
                          <span className="config-card__employee-number text-muted-soft">#{employeeNumber}</span>
                          <span>{employeeName}</span>
                          {emp.isBaja && <Badge variant="error">Baja</Badge>}
                          {'is_starlite' in emp && emp.is_starlite && <StarliteBadge />}
                        </h3>
                      </div>
                    </header>

                    {isCompactResult && (
                      <div className="config-compact-summary">
                        <dl className="config-compact-summary__facts">
                          <div>
                            <dt>Puesto</dt>
                            <dd>{displayValue(emp.puesto)}</dd>
                          </div>
                          <div>
                            <dt>Departamento</dt>
                            <dd>{displayValue(emp.area)}</dd>
                          </div>
                          <div>
                            <dt>Turno</dt>
                            <dd>{emp.turno ? displayValue(emp.turno) : 'Sin información'}</dd>
                          </div>
                        </dl>
                        <ButtonUtility
                          type="button"
                          className="config-compact-summary__toggle"
                          icon={isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                          onClick={() => handleToggleCompactResult(employeeDomId)}
                          aria-expanded={isExpanded}
                          aria-controls={compactDetailsId}
                        >
                          {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                        </ButtonUtility>
                      </div>
                    )}

                    {(!isCompactResult || isExpanded) && (
                    <div
                      id={isCompactResult ? compactDetailsId : undefined}
                      className="config-card__body"
                    >
                      <section className="config-card__details" aria-labelledby={`details-${employeeDomId}`}>
                        <h4 id={`details-${employeeDomId}`} className="config-card__section-title type-caption-up text-muted">
                          Información laboral
                        </h4>
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
                        {(() => {
                          if (emp.isBaja) return null;
                          const today = localTodayIso();
                          const renewalDate = addDaysToIso(emp.fecha_ingreso, 90);
                          if (renewalDate && renewalDate >= today) {
                            return (
                              <div className="notion-prop">
                                <dt className="notion-prop__label type-body-sm text-muted">Renov. contrato</dt>
                                <dd className="notion-prop__value type-body-sm-strong text-charcoal">{toTitleCase(formatReadableDate(renewalDate))}</dd>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {emp.isBaja && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Fecha de baja</dt>
                            <dd className="notion-prop__value type-body-sm-strong text-charcoal">{toTitleCase(formatReadableDate(emp.fecha_baja))}</dd>
                          </div>
                        )}
                        {emp.isBaja && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Motivo de baja</dt>
                            <dd className="notion-prop__value config-card__truncate type-body-sm-strong text-charcoal" title={emp.motivo_baja}>
                              {displayValue(emp.motivo_baja)}
                            </dd>
                          </div>
                        )}
                        {!(emp.isBaja && !emp.turno) && (
                          <div className="notion-prop">
                            <dt className="notion-prop__label type-body-sm text-muted">Turno</dt>
                            <dd className="notion-prop__value">
                              {emp.turno ? (
                                <Badge>{emp.turno}</Badge>
                              ) : (
                                <span className="type-body-sm-strong text-muted">N/A</span>
                              )}
                            </dd>
                          </div>
                        )}
                        </dl>
                      </section>

                      <section className="config-card__calendar-section" aria-labelledby={`calendar-${employeeDomId}`}>
                        <div className="config-calendar-header-actions">
                          <h4 id={`calendar-${employeeDomId}`} className="config-card__section-title type-caption-up text-muted">Calendario</h4>

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

                            if (!selectedMes) {
                              return (
                                <p className="config-calendar-empty type-body-sm text-muted" role="status">
                                  Aún no hay reportes guardados para consultar.
                                </p>
                              );
                            }

                            return (
                              <div className="config-calendar-grid-container config-calendar-grid-container--spaced">
                                <MiniCalendar
                                  mesStr={selectedMes}
                                  days={empDays}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </section>

                      <GlobalIncidenceHistory
                        employeeNumber={employeeNumber}
                        allReports={allReports}
                        titleId={`history-${employeeDomId}`}
                      />
                    </div>
                    )}
                  </article>
                );
              }) : (
                <div className="config-filter-empty" role="status">
                  <Search aria-hidden="true" />
                  <p className="type-body-md text-muted">
                    No hay colaboradores que coincidan con los filtros seleccionados.
                  </p>
                  <ButtonUtility
                    type="button"
                    icon={<RotateCcw aria-hidden="true" />}
                    onClick={handleClearFilters}
                  >
                    Limpiar filtros
                  </ButtonUtility>
                </div>
              )}
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
