import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CalendarDays,
  ChevronRight,
  MonitorCog,
  MoonStar,
  SunMedium,
  UserRound,
} from 'lucide';

import { Badge } from '@/components/ui/Badge';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SearchField } from '@/components/ui/SearchField';
import {
  compareBonoWeeksNewestFirst,
  groupBonoAsistenciaRecords,
  loadBonoAsistenciaData,
  type BonoAsistenciaEmployee,
  type BonoAsistenciaRecord,
} from '@/features/bono-asistencia/data';
import { BONO_PAGE_TITLE } from '@/features/bono-asistencia/constants';
import { usePagination } from '@/hooks/usePagination';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import './BonoAsistencia.css';

type LoadState =
  | { status: 'loading'; records: BonoAsistenciaRecord[] }
  | { status: 'success'; records: BonoAsistenciaRecord[] }
  | { status: 'error'; records: BonoAsistenciaRecord[] };

const ALL_OPTIONS = 'all';
const BONO_PAGE_SIZE = 12;
const THEME_SEQUENCE: readonly ThemePreference[] = ['system', 'light', 'dark'];

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX');
}

function uniqueValues(
  records: BonoAsistenciaRecord[],
  selectValue: (record: BonoAsistenciaRecord) => string,
): string[] {
  return Array.from(new Set(records.map(selectValue)));
}

function OccurrenceDetails({
  employee,
}: {
  employee: BonoAsistenciaEmployee;
}) {
  return (
    <div className="bono-page__occurrence-detail">
      <div className="bono-page__occurrence-summary">
        <span className="bono-page__occurrence-count">
          {employee.occurrences}{' '}
          {employee.occurrences === 1 ? 'registro' : 'registros'}
        </span>
        <span className="bono-page__occurrence-label">Semanas registradas</span>
      </div>
      <ul
        className="bono-page__occurrence-weeks"
        aria-label="Semanas incluidas en el acumulado"
      >
        {employee.weeks.map((week) => (
          <li key={week}>
            <MorphingIcon
              icon={CalendarDays}
              size="var(--icon-size-sm)"
              aria-hidden="true"
            />
            <span>{week}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BonoAsistencia() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    records: [],
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(ALL_OPTIONS);
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_OPTIONS);
  const [selectedEmployee, setSelectedEmployee] =
    useState<BonoAsistenciaEmployee | null>(null);
  const { preference, setThemePreference } = useTheme();

  const themeLabel =
    preference === 'system'
      ? 'Sistema'
      : preference === 'dark'
        ? 'Oscuro'
        : 'Claro';
  const ThemeIcon =
    preference === 'system'
      ? MonitorCog
      : preference === 'dark'
        ? MoonStar
        : SunMedium;

  const cycleTheme = useCallback(() => {
    const currentIndex = THEME_SEQUENCE.indexOf(preference);
    const nextIndex = (currentIndex + 1) % THEME_SEQUENCE.length;
    setThemePreference(THEME_SEQUENCE[nextIndex]);
  }, [preference, setThemePreference]);

  useEffect(() => {
    document.title = BONO_PAGE_TITLE;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState((current) => ({ status: 'loading', records: current.records }));

    loadBonoAsistenciaData(controller.signal)
      .then((records) => setLoadState({ status: 'success', records }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadState((current) => ({
          status: 'error',
          records: current.records,
        }));
      });

    return () => controller.abort();
  }, [reloadKey]);

  const weeks = useMemo(
    () =>
      uniqueValues(loadState.records, (record) => record.week).sort(
        compareBonoWeeksNewestFirst,
      ),
    [loadState.records],
  );
  const departments = useMemo(
    () =>
      uniqueValues(loadState.records, (record) => record.department).sort(
        (left, right) => left.localeCompare(right, 'es-MX'),
      ),
    [loadState.records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedTerm = normalizeForSearch(searchTerm.trim());

    return loadState.records.filter((record) => {
      const matchesWeek =
        selectedWeek === ALL_OPTIONS || record.week === selectedWeek;
      const matchesDepartment =
        selectedDepartment === ALL_OPTIONS ||
        record.department === selectedDepartment;
      const searchableText = normalizeForSearch(
        [
          record.employeeNumber,
          record.name,
          record.department,
          record.area,
          record.position,
          record.week,
          record.comments,
        ].join(' '),
      );

      return (
        matchesWeek &&
        matchesDepartment &&
        (normalizedTerm === '' || searchableText.includes(normalizedTerm))
      );
    });
  }, [loadState.records, searchTerm, selectedDepartment, selectedWeek]);

  const employees = useMemo(
    () => groupBonoAsistenciaRecords(filteredRecords),
    [filteredRecords],
  );
  const pagination = usePagination(employees, BONO_PAGE_SIZE);

  useEffect(() => {
    pagination.goToPage(1);
  }, [pagination.goToPage, searchTerm, selectedDepartment, selectedWeek]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedWeek !== ALL_OPTIONS ||
    selectedDepartment !== ALL_OPTIONS;

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedWeek(ALL_OPTIONS);
    setSelectedDepartment(ALL_OPTIONS);
  }, []);

  return (
    <main className="bono-page container" aria-labelledby="bono-page-title">
      <header className="page-header bono-page__header">
        <div className="page-header__content bono-page__heading">
          <div className="bono-page__kicker-row">
            <p className="bono-page__eyebrow">
              <MorphingIcon
                icon={BadgeDollarSign}
                size="var(--icon-size-control)"
                aria-hidden="true"
              />
              Asistencia
            </p>
            <ButtonUtility
              type="button"
              className="bono-page__theme-control"
              icon={
                <MorphingIcon
                  icon={ThemeIcon}
                  size="var(--icon-size-control)"
                  aria-hidden="true"
                />
              }
              onClick={cycleTheme}
              aria-label={`Cambiar tema. Tema actual: ${themeLabel}`}
            >
              <span className="bono-page__theme-label">Tema: {themeLabel}</span>
            </ButtonUtility>
          </div>
          <h1 id="bono-page-title" className="page-title">
            {BONO_PAGE_TITLE}
          </h1>
          <p className="bono-page__description">
            Historico personal Perdida de bono de asistencia.
          </p>
        </div>
      </header>

      <form
        className="bono-page__filters"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset className="bono-page__filter-fields">
          <legend className="sr-only">Filtrar registros del bono</legend>

          <div className="bono-page__search-control">
            <SearchField
              id="bono-search"
              label="Buscar por número, nombre, área o puesto"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Buscar empleado"
              autoComplete="off"
              aria-describedby="bono-results-status"
            />
          </div>

          <label className="bono-page__field" htmlFor="bono-week">
            <span className="bono-page__field-label">Semana</span>
            <select
              id="bono-week"
              className="bono-page__select"
              value={selectedWeek}
              onChange={(event) => setSelectedWeek(event.target.value)}
            >
              <option value={ALL_OPTIONS}>Todas las semanas</option>
              {weeks.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </label>

          <label className="bono-page__field" htmlFor="bono-department">
            <span className="bono-page__field-label">Departamento</span>
            <select
              id="bono-department"
              className="bono-page__select"
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
            >
              <option value={ALL_OPTIONS}>Todos los departamentos</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </form>

      <section
        className="bono-page__results"
        aria-labelledby="bono-results-title"
        aria-busy={loadState.status === 'loading'}
      >
        <div className="bono-page__results-header">
          <h2 id="bono-results-title" className="bono-page__results-title">
            Registros
          </h2>
          <p
            id="bono-results-status"
            className="bono-page__results-count"
            aria-live="polite"
            aria-atomic="true"
          >
            {employees.length} {employees.length === 1 ? 'persona' : 'personas'}
          </p>
        </div>

        {loadState.status === 'loading' && loadState.records.length === 0 ? (
          <div className="bono-page__state" role="status" aria-live="polite">
            <p>Cargando registros de asistencia…</p>
          </div>
        ) : loadState.status === 'error' && loadState.records.length === 0 ? (
          <div className="bono-page__state" role="alert">
            <h2 className="bono-page__state-title">No pudimos cargar los registros</h2>
            <p>Revisa tu conexión e intenta nuevamente.</p>
            <ButtonUtility
              type="button"
              className="bono-page__state-action"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Reintentar
            </ButtonUtility>
          </div>
        ) : employees.length === 0 ? (
          <div className="bono-page__state">
            <h2 className="bono-page__state-title">No hay coincidencias</h2>
            <p>Prueba con otros filtros o limpia la búsqueda actual.</p>
            {hasActiveFilters && (
              <ButtonUtility
                type="button"
                className="bono-page__state-action"
                onClick={clearFilters}
              >
                Limpiar filtros
              </ButtonUtility>
            )}
          </div>
        ) : (
          <ul className="bono-page__employee-grid" role="list">
            {pagination.pageItems.map((employee) => (
              <li key={employee.employeeNumber}>
                <button
                  type="button"
                  className="bono-page__employee-card"
                  onClick={() => setSelectedEmployee(employee)}
                  aria-label={`Ver detalle de ${employee.name}, número ${employee.employeeNumber}`}
                >
                  <span className="bono-page__employee-content">
                    <span className="bono-page__employee-name">
                      {employee.name}
                    </span>
                    <span className="bono-page__employee-number">
                      <span>Empleado {employee.employeeNumber}</span>
                      {employee.occurrences > 1 && (
                        <Badge
                          variant="default"
                          className="bono-page__recurrence-badge"
                        >
                          {employee.occurrences} registros
                        </Badge>
                      )}
                      {employee.isBaja && (
                        <Badge
                          variant="error"
                          minimal
                          className="bono-page__baja-badge"
                        >
                          Baja
                        </Badge>
                      )}
                    </span>
                  </span>
                  <MorphingIcon
                    icon={ChevronRight}
                    size="var(--icon-size-control)"
                    className="bono-page__employee-chevron"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {employees.length > 0 && pagination.totalPages > 1 && (
          <div className="bono-page__pagination">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
              canGoPrev={pagination.canGoPrev}
              canGoNext={pagination.canGoNext}
              ariaLabel="Paginación de empleados del bono"
              variant="compact"
            />
          </div>
        )}
      </section>

      <Modal
        isOpen={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.name ?? 'Detalle del empleado'}
        icon={
          <MorphingIcon
            icon={UserRound}
            size="var(--icon-size-control)"
            aria-hidden="true"
          />
        }
        size="sm"
      >
        {selectedEmployee && (
          <div className="modal-body bono-page__detail">
            <div className="bono-page__detail-identity">
              <span className="bono-page__metadata">
                <span>Empleado {selectedEmployee.employeeNumber}</span>
                {selectedEmployee.isBaja && (
                  <Badge variant="error" className="bono-page__baja-badge">
                    Baja
                  </Badge>
                )}
              </span>
            </div>
            <dl className="bono-page__detail-list">
              <div className="bono-page__detail-row">
                <dt>Departamento</dt>
                <dd>{selectedEmployee.department}</dd>
              </div>
              <div className="bono-page__detail-row">
                <dt>Área</dt>
                <dd>{selectedEmployee.area}</dd>
              </div>
              <div className="bono-page__detail-row">
                <dt>Puesto</dt>
                <dd>{selectedEmployee.position}</dd>
              </div>
              <div className="bono-page__detail-row bono-page__detail-occurrences">
                <dt>Acumulado</dt>
                <dd>
                  <OccurrenceDetails employee={selectedEmployee} />
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </main>
  );
}
