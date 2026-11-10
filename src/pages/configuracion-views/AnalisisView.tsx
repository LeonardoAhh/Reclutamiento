import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { PageHeaderAccessory, PageHeading } from '@/components/layout/PageHeading';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagination } from '@/hooks/usePagination';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import {
  useReporteDiario,
  type ReporteDiarioRecord,
} from '@/hooks/useReporteDiario';
import { useBajas } from '@/hooks/useBajas';
import { RotateCcw } from 'lucide-react';
import { Search as SearchData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { SearchField } from '@/components/ui/SearchField';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { AnalysisResultsFilters } from './components/AnalysisResultsFilters';
import { AnalysisResultsPanel } from './components/AnalysisResultsPanel';
import { getConfiguracionCopy } from './configuracion-translations';
import {
  ALL_FILTER_VALUE,
  normalizeFilterValue,
  normalizeSearchText,
  matchesSearchTokens,
  getRecentEmployeeIncidents,
  uniqueFilterValues,
  type EmployeeSearchResult,
  type SearchStatusFilter,
} from './analisis-helpers';
import '../Configuracion.css';

export function AnalisisView() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const copy = getConfiguracionCopy(language).analysis;
  const { loading: authLoading } = useAuth();
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useSupabaseData();

  const { bajas, loading: bajasLoading } = useBajas();
  const {
    fetchSummaries,
    fetchByMesList,
    error: reportsError,
  } = useReporteDiario();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<SearchStatusFilter>(ALL_FILTER_VALUE);
  const [departmentFilter, setDepartmentFilter] = useState(ALL_FILTER_VALUE);
  const [shiftFilter, setShiftFilter] = useState(ALL_FILTER_VALUE);
  const [isEmployeeDetailOpen, setIsEmployeeDetailOpen] = useState(false);
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
  const selectedDepartmentLabel = departmentFilter === ALL_FILTER_VALUE
    ? copy.all
    : departmentOptions.find((option) => option.value === departmentFilter)?.label ?? departmentFilter;
  const selectedShiftLabel = shiftFilter === ALL_FILTER_VALUE
    ? copy.all
    : shiftOptions.find((option) => option.value === shiftFilter)?.label ?? shiftFilter;

  // 3. Aplicar filtros secundarios
  const filteredEmployees = useMemo(() => {
    return textMatches.filter((employee) => {
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
  }, [textMatches, statusFilter, departmentFilter, shiftFilter]);

  // 4. Paginación
  const orderedEmployees = useMemo(() => {
    const hasIncidents = new Map(
      filteredEmployees.map(
        (employee) => [employee, getRecentEmployeeIncidents(employee.num_empleado, allReports).length > 0] as const,
      ),
    );

    return [...filteredEmployees].sort(
      (first, second) =>
        Number(hasIncidents.get(second)) - Number(hasIncidents.get(first)) ||
        second.num_empleado.localeCompare(first.num_empleado, 'es', { numeric: true }),
    );
  }, [allReports, filteredEmployees]);

  const employeePagination = usePagination(orderedEmployees, 7);

  useEffect(() => {
    employeePagination.goToPage(1);
  }, [
    searchQuery,
    statusFilter,
    departmentFilter,
    shiftFilter,
    employeePagination.goToPage,
  ]);

  const firstVisibleResult =
    (employeePagination.currentPage - 1) * employeePagination.pageSize + 1;
  const lastVisibleResult = Math.min(
    employeePagination.currentPage * employeePagination.pageSize,
    employeePagination.totalItems,
  );

  const hasActiveFilters =
    statusFilter !== ALL_FILTER_VALUE ||
    departmentFilter !== ALL_FILTER_VALUE ||
    shiftFilter !== ALL_FILTER_VALUE;
  const shouldLoadReports =
    (searchQuery.length > 0 || hasActiveFilters) && filteredEmployees.length > 0;

  // Removemos el useEffect que reseteaba los filtros para permitir buscar DENTRO de un filtro.

  useEffect(() => {
    if (reportsFetched || !shouldLoadReports) return;

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
  }, [fetchSummaries, fetchByMesList, reportsFetched, shouldLoadReports]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || searchTerm.length === 0) return;
    event.preventDefault();
    handleClearSearch();
  };

  const searchField = (
    <SearchField
      id="config-search-input"
      className={`search-field--intrinsic${isMobile ? '' : ' search-field--header'}`}
      ref={searchInputRef}
      label={copy.searchLabel}
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      onKeyDown={handleSearchKeyDown}
      onClear={handleClearSearch}
      placeholder={copy.searchPlaceholder}
      autoComplete="off"
      enterKeyHint="search"
      aria-keyshortcuts="Control+K Meta+K"
      aria-controls="config-search-results"
    />
  );
  const searchRegion = (
    <div role="search" aria-label={copy.searchRegion}>
      {searchField}
    </div>
  );

  const handleClearFilters = () => {
    setStatusFilter(ALL_FILTER_VALUE);
    setDepartmentFilter(ALL_FILTER_VALUE);
    setShiftFilter(ALL_FILTER_VALUE);
  };

  return (
    <BoneyardSkeleton
      name="analisis-page"
      loading={authLoading || employeesLoading || bajasLoading}
      loadingLabel={copy.loading}
    >
      <section className="analisis-view config-page" aria-labelledby="analisis-title">
        <PageHeading id="analisis-title" className="config-page__title app-page-title">
          {copy.title}
        </PageHeading>
        {!isMobile && <PageHeaderAccessory>{searchRegion}</PageHeaderAccessory>}
        {employeesError && (
          <p className="config-search-error type-body-md mt-sm" role="alert">
            {copy.loadError}
          </p>
        )}

        {isMobile && (
          <div className="analisis-overview">
            <section className="config-page__toolbar">
              <div className="config-search-field">{searchRegion}</div>
            </section>
          </div>
        )}

        <section id="config-search-results" aria-label={copy.results}>
          {!isEmployeeDetailOpen && (
            <section className="config-results-controls" aria-label={copy.filtersAndResults}>
              <AnalysisResultsFilters
                statusFilter={statusFilter}
                departmentFilter={departmentFilter}
                shiftFilter={shiftFilter}
                departmentOptions={departmentOptions}
                shiftOptions={shiftOptions}
                selectedDepartmentLabel={selectedDepartmentLabel}
                selectedShiftLabel={selectedShiftLabel}
                hasActiveFilters={hasActiveFilters}
                copy={copy}
                onStatusFilterChange={setStatusFilter}
                onDepartmentFilterChange={setDepartmentFilter}
                onShiftFilterChange={setShiftFilter}
                onClearFilters={handleClearFilters}
              />
            </section>
          )}

          {searchQuery.length === 0 && !hasActiveFilters ? (
            <div className="animated-empty-state analisis-view__empty">
              <div className="animated-empty-state__icon">
                <MorphingIcon icon={SearchData} aria-hidden="true" />
              </div>
              <div className="animated-empty-state__title">{copy.initialTitle}</div>
              <p className="animated-empty-state__subtitle">{copy.initialDescription}</p>
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="config-results-wrapper">
              <AnalysisResultsPanel
                pagination={employeePagination}
                reports={allReports}
                reportsLoading={reportsLoading}
                reportsFetched={reportsFetched}
                reportsError={Boolean(reportsError)}
                onRetryReports={() => setReportsFetched(false)}
                paginationLabel={copy.pagination}
                resultCount={`${copy.resultRange} ${firstVisibleResult}–${lastVisibleResult} ${copy.of} ${employeePagination.totalItems} ${
                  employeePagination.totalItems === 1 ? copy.employee : copy.employees
                }`}
                onDetailViewChange={setIsEmployeeDetailOpen}
              />
            </div>
          ) : (
            <div className="config-empty" role="status">
              <MorphingIcon
                icon={SearchData}
                size="var(--icon-size-xxl)"
                className="text-muted-soft config-empty__icon"
                aria-hidden="true"
              />
              <p className="type-body-md text-muted config-empty__copy">
                {hasActiveFilters ? copy.noFilterMatches : `${copy.noSearchResults} “${searchQuery}”.`}
              </p>
              {hasActiveFilters && (
                <ButtonUtility type="button" icon={<RotateCcw aria-hidden="true" />} onClick={handleClearFilters}>
                  {copy.clearFilters}
                </ButtonUtility>
              )}
            </div>
          )}
        </section>
      </section>
    </BoneyardSkeleton>
  );
}
