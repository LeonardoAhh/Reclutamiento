import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import {
  useReporteDiario,
  type ReporteDiarioRecord,
} from '@/hooks/useReporteDiario';
import { useBajas } from '@/hooks/useBajas';
import {
  LayoutGrid,
  List,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Search as SearchData, X as XIconData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmployeeResultCard } from './components/EmployeeResultCard';
import {
  getEmployeeResultId,
  normalizeFilterValue,
  uniqueFilterValues,
  type EmployeeSearchResult,
  type SearchViewMode,
} from './busqueda-helpers';
import '../Configuracion.css';

type SearchStatusFilter = 'all' | 'active' | 'inactive';

const ALL_FILTER_VALUE = 'all';

export function BusquedaView() {
  const { loading: authLoading } = useAuth();
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useSupabaseData();
  const { bajas, loading: bajasLoading } = useBajas();
  const { fetchSummaries, fetchByMesList } = useReporteDiario();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SearchStatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState(ALL_FILTER_VALUE);
  const [shiftFilter, setShiftFilter] = useState(ALL_FILTER_VALUE);
  const [viewMode, setViewMode] = useState<SearchViewMode>('detail');
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(
    () => new Set(),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [summariesLoading, setSummariesLoading] = useState(true);
  const [allReports, setAllReports] = useState<ReporteDiarioRecord[]>([]);

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      try {
        const data = await fetchSummaries();
        if (!active) return;

        const reports = data.length > 0
          ? await fetchByMesList(data.map((summary) => summary.mes))
          : [];
        if (active) setAllReports(reports);
      } finally {
        if (active) setSummariesLoading(false);
      }
    };

    void loadReports();
    return () => {
      active = false;
    };
  }, [fetchSummaries, fetchByMesList]);

  const searchQuery = searchTerm.trim();

  const searchMatches = useMemo<EmployeeSearchResult[]>(() => {
    const query = searchQuery.toLocaleLowerCase('es');
    if (query.length < 2) return [];

    const activeMatches: EmployeeSearchResult[] = employees
      .filter(
        (employee) =>
          employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
          employee.nombre.toLocaleLowerCase('es').includes(query),
      )
      .map((employee) => ({ ...employee, isBaja: false as const }));

    const bajaMatches: EmployeeSearchResult[] = bajas
      .filter(
        (employee) =>
          employee.num_empleado.toLocaleLowerCase('es').includes(query) ||
          employee.nombre.toLocaleLowerCase('es').includes(query),
      )
      .map((employee) => ({ ...employee, isBaja: true as const }));

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

  const hasActiveFilters =
    statusFilter !== 'all' ||
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
      <section className="busqueda-view config-page" aria-busy="true">
        <div className="busqueda-skeleton" aria-hidden="true">
          <Skeleton
            variant="rect"
            width="100%"
            height="var(--touch-target-min)"
            radius="var(--rounded-md)"
          />
          <Skeleton
            variant="rect"
            width="100%"
            height="var(--skeleton-card-height)"
            radius="var(--rounded-md)"
          />
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          Cargando colaboradores…
        </span>
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
    <section className="busqueda-view config-page" aria-labelledby="busqueda-title">
      {employeesError && (
        <p className="config-search-error type-body-sm mt-sm" role="alert">
          No fue posible actualizar la lista de colaboradores. Se muestran los datos
          disponibles.
        </p>
      )}

      <section
        className="config-page__toolbar"
        role="search"
        aria-label="Buscar colaboradores"
      >
        <div className="form-group config-search">
          <label htmlFor="config-search-input" className="sr-only">
            Buscar empleado
          </label>
          <div className="config-search__wrapper">
            {searchTerm.length > 0 ? (
              <button
                type="button"
                className="config-search__icon config-search__icon--action"
                onClick={handleClearSearch}
                aria-label="Limpiar búsqueda"
              >
                <MorphingIcon
                  icon={XIconData}
                  size={18}
                  className="text-muted"
                  aria-hidden="true"
                />
              </button>
            ) : (
              <span className="config-search__icon" aria-hidden="true">
                <MorphingIcon
                  icon={SearchData}
                  size={18}
                  className="text-muted"
                />
              </span>
            )}
            <input
              id="config-search-input"
              ref={searchInputRef}
              type="text"
              inputMode="search"
              placeholder="Buscar empleado por nombre o número…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoComplete="off"
              aria-controls="config-search-results"
              aria-describedby={showHelperText ? 'config-search-hint' : undefined}
            />
          </div>
          {showHelperText && (
            <p
              id="config-search-hint"
              className="config-search__hint type-caption-sm text-muted-soft"
            >
              Escribe al menos 2 caracteres para buscar.
            </p>
          )}
        </div>
      </section>

      <section
        id="config-search-results"
        aria-label="Resultados de búsqueda"
        aria-busy={summariesLoading}
      >
        {summariesLoading && (
          <span className="sr-only" role="status" aria-live="polite">
            Cargando reportes disponibles…
          </span>
        )}
        {searchQuery.length < 2 ? (
          <div className="animated-empty-state busqueda-view__empty">
            <div className="animated-empty-state__icon">
              <MorphingIcon icon={SearchData} aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">
              Busca un colaborador
            </div>
            <p className="animated-empty-state__subtitle">
              Consulta su información laboral, asistencia e historial de incidencias.
            </p>
          </div>
        ) : searchMatches.length > 0 ? (
          <div className="config-results-wrapper">
            <h3 className="sr-only">Resultados de búsqueda</h3>

            <section
              className="config-results-controls"
              aria-label="Filtros y vista de resultados"
            >
              <div className="config-results-controls__heading config-filter-field">
                <span
                  className="config-filter-label type-caption-sm text-muted"
                  aria-hidden="true"
                >
                  &nbsp;
                </span>
                <div className="config-results-controls__heading-content">
                  <SlidersHorizontal aria-hidden="true" />
                  <span className="type-body-sm-strong text-charcoal">
                    Filtrar resultados
                  </span>
                </div>
              </div>

              <div className="config-results-controls__filters">
                <fieldset className="config-filter-group">
                  <legend className="config-filter-label type-caption-sm text-muted">
                    Estado
                  </legend>
                  <div className="config-segmented-control">
                    {([
                      ['all', 'Todos'],
                      ['active', 'Activos'],
                      ['inactive', 'Bajas'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`config-segmented-control__button${
                          statusFilter === value ? ' is-active' : ''
                        }`}
                        onClick={() => setStatusFilter(value)}
                        aria-pressed={statusFilter === value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="config-filter-field">
                  <span className="config-filter-label type-caption-sm text-muted">
                    Departamento
                  </span>
                  <CustomSelect
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={[
                      { value: ALL_FILTER_VALUE, label: 'Todos' },
                      ...departmentOptions,
                    ]}
                  />
                </label>

                <label className="config-filter-field">
                  <span className="config-filter-label type-caption-sm text-muted">
                    Turno
                  </span>
                  <CustomSelect
                    value={shiftFilter}
                    onChange={setShiftFilter}
                    options={[
                      { value: ALL_FILTER_VALUE, label: 'Todos' },
                      ...shiftOptions,
                    ]}
                  />
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
                <div
                  className="config-view-switch"
                  role="group"
                  aria-label="Vista de resultados"
                >
                  <button
                    type="button"
                    className={`config-view-switch__button${
                      viewMode === 'detail' ? ' is-active' : ''
                    }`}
                    onClick={() => handleViewModeChange('detail')}
                    aria-pressed={viewMode === 'detail'}
                  >
                    <List aria-hidden="true" />
                    Detallada
                  </button>
                  <button
                    type="button"
                    className={`config-view-switch__button${
                      viewMode === 'compact' ? ' is-active' : ''
                    }`}
                    onClick={() => handleViewModeChange('compact')}
                    aria-pressed={viewMode === 'compact'}
                  >
                    <LayoutGrid aria-hidden="true" />
                    Compacta
                  </button>
                </div>
              )}
            </section>

            <p
              className="config-results__count type-caption-sm text-muted"
              aria-live="polite"
            >
              {hasActiveFilters
                ? `${filteredEmployees.length} de ${searchMatches.length} resultados para “${searchQuery}”`
                : `${searchMatches.length} resultado${searchMatches.length !== 1 ? 's' : ''} para “${searchQuery}”`}
            </p>

            <div
              className={`config-results${viewMode === 'compact' ? ' config-results--compact' : ''}`}
            >
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const resultId = getEmployeeResultId(employee);

                  return (
                    <EmployeeResultCard
                      key={resultId}
                      employee={employee}
                      resultId={resultId}
                      viewMode={viewMode}
                      isExpanded={expandedResultIds.has(resultId)}
                      reportsLoading={summariesLoading}
                      reports={allReports}
                      onToggle={() => handleToggleCompactResult(resultId)}
                    />
                  );
                })
              ) : (
                <div className="config-filter-empty" role="status">
                  <MorphingIcon icon={SearchData} aria-hidden="true" />
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
            <MorphingIcon
              icon={SearchData}
              size={32}
              className="text-muted-soft config-empty__icon"
              aria-hidden="true"
            />
            <p className="type-body-md text-muted config-empty__copy">
              No se encontraron resultados para “{searchQuery}”.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
