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
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { EmployeeResultCard } from './components/EmployeeResultCard';
import {
  getEmployeeResultId,
  normalizeFilterValue,
  normalizeSearchText,
  matchesSearchTokens,
  uniqueFilterValues,
  isNuevoIngreso,
  hasExcesoFaltas,
  type EmployeeSearchResult,
  type SearchViewMode,
} from './busqueda-helpers';
import '../Configuracion.css';

type SearchStatusFilter = 'all' | 'active' | 'inactive';
type RiskFilter = 'all' | 'nuevos_ingresos' | 'riesgo_baja';

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SearchStatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState(ALL_FILTER_VALUE);
  const [shiftFilter, setShiftFilter] = useState(ALL_FILTER_VALUE);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [viewMode, setViewMode] = useState<SearchViewMode>('compact');
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleLimit, setVisibleLimit] = useState(10);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [allReports, setAllReports] = useState<ReporteDiarioRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFetched, setReportsFetched] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const searchQuery = debouncedSearchTerm.trim();

  // 1. Coincidencia por texto
  const textMatches = useMemo<EmployeeSearchResult[]>(() => {
    const query = normalizeSearchText(searchQuery);
    
    // Si no hay búsqueda de texto, devolvemos todos (se filtrarán después por estado/área)
    if (query.length === 0) {
      const activeMatches = employees.map((employee) => ({ ...employee, isBaja: false as const }));
      const bajaMatches = bajas.map((employee) => ({ ...employee, isBaja: true as const }));
      return [...activeMatches, ...bajaMatches];
    }

    const searchTokens = query.split(/\s+/).filter(Boolean);

    const activeMatches: EmployeeSearchResult[] = employees
      .map((employee) => ({ ...employee, isBaja: false as const }))
      .filter((employee) => matchesSearchTokens(employee, searchTokens));

    const bajaMatches: EmployeeSearchResult[] = bajas
      .map((employee) => ({ ...employee, isBaja: true as const }))
      .filter((employee) => matchesSearchTokens(employee, searchTokens));

    return [...activeMatches, ...bajaMatches];
  }, [searchQuery, employees, bajas]);

  // 2. Opciones de filtros basadas en las coincidencias de texto
  const departmentOptions = useMemo(
    () => uniqueFilterValues(textMatches, 'area'),
    [textMatches],
  );
  const shiftOptions = useMemo(
    () => uniqueFilterValues(textMatches, 'turno'),
    [textMatches],
  );

  // 3. Aplicar filtros secundarios
  const filteredEmployees = useMemo(() => {
    const result = textMatches.filter((employee) => {
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
      if (riskFilter === 'nuevos_ingresos' && (employee.isBaja || !isNuevoIngreso(employee.fecha_ingreso))) return false;
      if (
        riskFilter === 'riesgo_baja' &&
        (employee.isBaja || !reportsFetched || !isNuevoIngreso(employee.fecha_ingreso) || !hasExcesoFaltas(employee.num_empleado, allReports))
      ) {
        return false;
      }
      return true;
    });

    if (riskFilter !== 'all') {
      result.sort((a, b) => {
        const dateA = a.fecha_ingreso || '';
        const dateB = b.fecha_ingreso || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.nombre.localeCompare(b.nombre);
      });
    }

    return result;
  }, [textMatches, statusFilter, departmentFilter, shiftFilter, riskFilter, reportsFetched, allReports]);

  // 4. Paginación
  const paginatedEmployees = useMemo(
    () => filteredEmployees.slice(0, visibleLimit),
    [filteredEmployees, visibleLimit]
  );

  const hasActiveFilters =
    statusFilter !== 'all' ||
    departmentFilter !== ALL_FILTER_VALUE ||
    shiftFilter !== ALL_FILTER_VALUE ||
    riskFilter !== 'all';
    
  const isSingleResult = filteredEmployees.length === 1 && searchQuery.length > 2;
  const canUseCompactView = filteredEmployees.length > 1;

  // Removemos el useEffect que reseteaba los filtros para permitir buscar DENTRO de un filtro.

  useEffect(() => {
    if (reportsFetched) return;

    let active = true;
    const loadReports = async () => {
      setReportsLoading(true);
      try {
        const data = await fetchSummaries();
        if (!active) return;
        const reports = data.length > 0
          ? await fetchByMesList(data.map((summary) => summary.mes))
          : [];
        if (active) {
          setAllReports(reports);
          setReportsFetched(true);
        }
      } finally {
        if (active) setReportsLoading(false);
      }
    };
    void loadReports();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSummaries, fetchByMesList]);

  useEffect(() => {
    if (!canUseCompactView && viewMode === 'compact') setViewMode('detail');
  }, [canUseCompactView, viewMode]);

  const metrics = useMemo(() => {
    let nuevosIngresos = 0;
    let riesgoBaja = 0;
    
    for (const emp of employees) {
      const nuevo = isNuevoIngreso(emp.fecha_ingreso);
      if (nuevo) nuevosIngresos++;
      if (nuevo && reportsFetched && hasExcesoFaltas(emp.num_empleado, allReports)) {
        riesgoBaja++;
      }
    }
    return { nuevosIngresos, riesgoBaja };
  }, [employees, allReports, reportsFetched]);

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter(ALL_FILTER_VALUE);
    setShiftFilter(ALL_FILTER_VALUE);
    setRiskFilter('all');
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
    <BoneyardSkeleton
      name="configuracion-busqueda"
      loading={authLoading || employeesLoading || bajasLoading}
      loadingLabel="Cargando colaboradores…"
    >
      <section className="busqueda-view config-page" aria-labelledby="busqueda-title">
      {employeesError && (
        <p className="config-search-error type-body-sm mt-sm" role="alert">
          No fue posible actualizar la lista de colaboradores. Se muestran los datos
          disponibles.
        </p>
      )}

      <section className="busqueda-hero" aria-label="Indicadores de riesgo">
        <button 
          type="button" 
          className={`busqueda-hero__card busqueda-hero__card--new ${riskFilter === 'nuevos_ingresos' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter(r => r === 'nuevos_ingresos' ? 'all' : 'nuevos_ingresos')}
        >
          <div className="busqueda-hero__card-header">
            <span className="busqueda-hero__card-title">Nuevos Ingresos</span>
            <span className="busqueda-hero__card-count">{metrics.nuevosIngresos}</span>
          </div>
        </button>
        
        <button 
          type="button" 
          className={`busqueda-hero__card busqueda-hero__card--risk ${riskFilter === 'riesgo_baja' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter(r => r === 'riesgo_baja' ? 'all' : 'riesgo_baja')}
        >
          <div className="busqueda-hero__card-header">
            <span className="busqueda-hero__card-title">Riesgo No Renovación</span>
            <span
              className="busqueda-hero__card-count"
              aria-busy={reportsLoading}
              aria-live="polite"
            >
              {metrics.riesgoBaja}
            </span>
          </div>
        </button>
      </section>
      {reportsLoading && (
        <span className="sr-only" role="status" aria-live="polite">
          Actualizando riesgo de no renovación…
        </span>
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
      >

        <section
          className="config-results-controls"
          aria-label="Filtros y vista de resultados"
        >
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
            <div className="config-filter-field">
              <span
                className="config-filter-label type-caption-sm text-transparent"
                aria-hidden="true"
                style={{ userSelect: 'none' }}
              >
                &nbsp;
              </span>
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
            </div>
          )}
        </section>

        {searchQuery.length === 0 && !hasActiveFilters ? (
          <div className="animated-empty-state busqueda-view__empty">
            <div className="animated-empty-state__icon">
              <MorphingIcon icon={SearchData} aria-hidden="true" />
            </div>
            <div className="animated-empty-state__title">
              Busca un colaborador o selecciona un filtro
            </div>
            <p className="animated-empty-state__subtitle">
              Consulta su información laboral, asistencia e historial de incidencias.
            </p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="config-results-wrapper">
            <p
              className="config-results__count type-caption-sm text-muted"
              aria-live="polite"
            >
              {hasActiveFilters
                ? `Mostrando ${paginatedEmployees.length} de ${filteredEmployees.length} resultados filtrados (de ${textMatches.length} coincidencias)`
                : `Mostrando ${paginatedEmployees.length} de ${textMatches.length} resultados para “${searchQuery}”`}
            </p>

            <div
              className={`config-results${viewMode === 'compact' ? ' config-results--compact' : ''}`}
            >
              {filteredEmployees.length > 0 ? (
                <>
                  {paginatedEmployees.map((employee) => {
                    const resultId = getEmployeeResultId(employee);

                    return (
                      <EmployeeResultCard
                        key={resultId}
                        employee={employee}
                        resultId={resultId}
                        viewMode={viewMode}
                        isRiskFilter={riskFilter === 'riesgo_baja'}
                        isExpanded={expandedResultIds.has(resultId)}
                        autoExpand={isSingleResult}
                        reports={allReports}
                        reportsLoading={reportsLoading}
                        onToggle={() => handleToggleCompactResult(resultId)}
                      />
                    );
                  })}
                  
                  {filteredEmployees.length > visibleLimit && (
                    <div className="config-results-load-more">
                      <ButtonUtility
                        onClick={() => setVisibleLimit((v) => v + 10)}
                        className="button-utility--wide"
                      >
                        Cargar más resultados
                      </ButtonUtility>
                    </div>
                  )}
                </>
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
    </BoneyardSkeleton>
  );
}
