import type { ReactNode } from 'react';
import {
  ChevronDown,
  Copy,
  SlidersHorizontal,
  UserRoundPlus as UserPlusIcon,
  UsersRound,
} from 'lucide-react';
import { Search as SearchData } from 'lucide';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeaderAccessory } from '@/components/layout/PageHeading';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SearchField } from '@/components/ui/SearchField';
import { DepartmentSearchResults } from '@/components/plantilla/DepartmentSearchResults';
import { DepartmentCard } from '@/components/plantilla/DepartmentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { workforceText } from '@/pages/workforce-translations';
import type { DepartmentCoverage, Employee } from '@/lib/types';
import type { WorkforceProjection } from '@/lib/workforceProjection';

interface WorkforceWorkspaceContentProps {
  activeTab: string;
  areaDetail: ReactNode;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  showOnlyStarlite: boolean;
  isAdmin: boolean;
  isInitialWorkforceLoad: boolean;
  employees: Employee[];
  matchingEmployees: Employee[];
  normalizedSearchTerm: string;
  hasSearchQuery: boolean;
  hasSearchResults: boolean;
  filteredDepartments: DepartmentCoverage[];
  departmentProjections: ReadonlyMap<string, WorkforceProjection>;
  incapacityByArea: ReadonlyMap<string, number>;
  onProjectFilterChange: (value: string) => void;
  onCreateEmployee: () => void;
  onCopyVacancyReport: () => void;
  onOpenPositionSettings: () => void;
  onClearSearchAndFilter: () => void;
  onEditEmployee: (employee: Employee) => void;
  onPromoteEmployee: (employee: Employee) => void;
  onUpdateIncapacity: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onOpenDepartment: (area: string) => void;
}

export function WorkforceWorkspaceContent({
  activeTab,
  areaDetail,
  searchTerm,
  onSearchChange,
  onSearchClear,
  showOnlyStarlite,
  isAdmin,
  isInitialWorkforceLoad,
  employees,
  matchingEmployees,
  normalizedSearchTerm,
  hasSearchQuery,
  hasSearchResults,
  filteredDepartments,
  departmentProjections,
  incapacityByArea,
  onProjectFilterChange,
  onCreateEmployee,
  onCopyVacancyReport,
  onOpenPositionSettings,
  onClearSearchAndFilter,
  onEditEmployee,
  onPromoteEmployee,
  onUpdateIncapacity,
  onDeleteEmployee,
  onOpenDepartment,
}: WorkforceWorkspaceContentProps) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const t = (text: string) => workforceText(language, text);
  const searchField = (
    <SearchField
      id="search-input"
      className={isMobile ? 'dashboard-sidebar__search-field' : 'search-field--intrinsic search-field--header'}
      label={t('Buscar en la plantilla')}
      placeholder={t('Buscar')}
      value={searchTerm}
      onChange={(event) => onSearchChange(event.target.value)}
      onClear={onSearchClear}
      autoComplete="off"
      aria-controls="dashboard-departments"
    />
  );
  const searchRegion = isMobile ? (
    <div className="dashboard-sidebar__search" role="search" aria-label={t('Buscar en la plantilla')}>
      <div className="dashboard-sidebar__search-wrapper">{searchField}</div>
    </div>
  ) : (
    <div role="search" aria-label={t('Buscar en la plantilla')}>
      {searchField}
    </div>
  );

  const overview = (
    <>
      <header className="dashboard__hero dashboard-sidebar__hero">
        <div className="dashboard__hero-content dashboard-sidebar__hero-content">
          {isMobile && searchRegion}
          <div
            className={`dashboard-sidebar__utilities${isAdmin ? ' dashboard-sidebar__utilities--admin' : ''}`}
          >
            <div className="dashboard-sidebar__utility-group dashboard-sidebar__utility-group--primary">
              <button
                type="button"
                className="btn-primary dashboard-sidebar__create-button"
                data-cuelume-open=""
                onClick={onCreateEmployee}
                aria-label={t('Nuevo empleado')}
              >
                <UserPlusIcon size={16} aria-hidden="true" />
                <span className="dashboard-sidebar__utility-label">{t('Nuevo')}</span>
              </button>
              <CustomSelect
                id="workforce-project-filter"
                className="dashboard-sidebar__starlite-filter"
                aria-label={`${t('Filtrar por proyecto')}: ${t(showOnlyStarlite ? 'Starlite' : 'Proyectos')}`}
                value={showOnlyStarlite ? 'starlite' : 'all'}
                options={[
                  { value: 'all', label: t('Proyectos') },
                  { value: 'starlite', label: 'Starlite' },
                ]}
                showPlaceholderOption={false}
                onChange={onProjectFilterChange}
                triggerAppearance="control"
                customTrigger={
                  <span className="dashboard-sidebar__project-trigger">
                    <span>
                      {t(showOnlyStarlite ? 'Starlite' : 'Proyecto')}
                    </span>
                    <ChevronDown className="dashboard-sidebar__project-chevron" aria-hidden="true" />
                  </span>
                }
              />
            </div>
            {isAdmin && (
              <div className="dashboard-sidebar__utility-group dashboard-sidebar__utility-group--admin">
                <div className="dashboard__hero-actions">
                  <button
                    type="button"
                    className="btn-secondary dashboard__report-btn dashboard-sidebar__report-action dashboard-sidebar__mobile-icon-control"
                    data-cuelume-tap=""
                    onClick={() => void onCopyVacancyReport()}
                    aria-label={t('Reporte')}
                    disabled={isInitialWorkforceLoad}
                  >
                    <Copy size={16} aria-hidden="true" />
                    <span className="dashboard-sidebar__utility-label dashboard-sidebar__utility-label--wide">
                      {t('Reporte')}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary dashboard__report-btn dashboard-sidebar__settings-action dashboard-sidebar__mobile-icon-control"
                    data-cuelume-open=""
                    onClick={onOpenPositionSettings}
                    title={t('Configurar plantilla, backup y Starlite')}
                    aria-label={t('Configurar plantilla, backup y Starlite')}
                    aria-haspopup="dialog"
                  >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    <span className="dashboard-sidebar__utility-label dashboard-sidebar__utility-label--wide">
                      {t('Configurar')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard__departments" id="dashboard-departments">
        {filteredDepartments.length === 0 && employees.length === 0 && (
          <div className="dashboard__empty" id="dashboard-empty">
            <UsersRound size={48} strokeWidth={2.5} />
            <h2>{t('Sin datos cargados')}</h2>
            <p>{t('Importa un archivo JSON o crea un empleado para comenzar.')}</p>
          </div>
        )}

        {employees.length > 0 && normalizedSearchTerm.length === 1 && (
          <p className="dashboard__search-hint" role="status">
            {t('Escribe al menos 2 caracteres para buscar.')}
          </p>
        )}

        {(hasSearchQuery || showOnlyStarlite) && matchingEmployees.length > 0 && (
          <DepartmentSearchResults
            employees={matchingEmployees}
            onEdit={onEditEmployee}
            onPromote={onPromoteEmployee}
            onIncapacidad={onUpdateIncapacity}
            onDelete={onDeleteEmployee}
          />
        )}

        {hasSearchQuery && !showOnlyStarlite && filteredDepartments.length > 0 && (
          <header className="dashboard__department-match-heading">
            <h2>{t('Departamentos y puestos')}</h2>
            <span>
              {filteredDepartments.length} {t(filteredDepartments.length === 1 ? 'coincidencia' : 'coincidencias')}
            </span>
          </header>
        )}

        {(hasSearchQuery || showOnlyStarlite) && !hasSearchResults && employees.length > 0 && (
          <div className="dashboard__empty" id="dashboard-no-results">
            <MorphingIcon icon={SearchData} size={48} strokeWidth={2.5} />
            <h2>{t('Sin resultados')}</h2>
            <p>
              {showOnlyStarlite && !hasSearchQuery
                ? t('No hay empleados del proyecto Starlite.')
                : t('No se encontraron coincidencias para tu búsqueda.')}
            </p>
            <button type="button" className="btn-secondary" onClick={onClearSearchAndFilter}>
              {t(showOnlyStarlite ? 'Limpiar filtros' : 'Limpiar búsqueda')}
            </button>
          </div>
        )}

        {!hasSearchQuery && !showOnlyStarlite && filteredDepartments.length === 0 && employees.length > 0 && (
          <div className="dashboard__empty" id="dashboard-no-results">
            <MorphingIcon icon={SearchData} size={48} strokeWidth={2.5} />
            <h2>{t('Sin resultados')}</h2>
            <p>{t('No hay departamentos que coincidan con el filtro.')}</p>
          </div>
        )}

        {filteredDepartments.map((department) => (
          <DepartmentCard
            key={department.area}
            area={department.area}
            projection={departmentProjections.get(department.area)}
            onOpen={() => onOpenDepartment(department.area)}
            incapacidadCount={incapacityByArea.get(department.area) ?? 0}
          />
        ))}
      </section>
    </>
  );

  return (
    <>
      {!isMobile && activeTab === 'general' && <PageHeaderAccessory>{searchRegion}</PageHeaderAccessory>}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="dashboard__content-area"
        >
          {activeTab === 'general' ? overview : areaDetail}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
