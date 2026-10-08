import { Inbox, Plus, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Activity, ActivityStatus } from "@/lib/types";
import { ActivityCard } from "@/components/ui/ActivityCard";
import { Pagination } from "@/components/ui/Pagination";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { CustomSelect, type Option } from "@/components/ui/CustomSelect";
import "./ActivitiesSection.css";

type ActivityStatusFilter = ActivityStatus | "todas";
type ActivitySortOrder = "newest" | "oldest" | "status";

interface RecruiterOption {
  id: string;
  display_name?: string | null;
  username?: string | null;
}

interface ActivitiesPagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

interface ActivitiesSectionProps {
  activities: Activity[];
  filteredActivities: Activity[];
  pageItems: Activity[];
  recruiters: RecruiterOption[];
  isAdmin: boolean;
  currentUserId?: string;
  statusFilter: ActivityStatusFilter;
  searchQuery: string;
  sortOrder: ActivitySortOrder;
  recruiterFilter: string;
  statusCounts: Record<ActivityStatusFilter, number>;
  pagination: ActivitiesPagination;
  isNew: (activity: Activity) => boolean;
  onStatusFilterChange: (status: ActivityStatusFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onSortOrderChange: (order: ActivitySortOrder) => void;
  onRecruiterFilterChange: (recruiterId: string) => void;
  onClearFilters: () => void;
  onCreate: () => void;
  onOpen: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onViewReference: (source: string) => void;
}

interface ActivityWithAssignee extends Activity {
  asignado_a_profile?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

const STATUS_FILTERS: Array<{
  key: ActivityStatusFilter;
  label: string;
}> = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_proceso", label: "En proceso" },
  { key: "completada", label: "Completadas" },
];

const SORT_OPTIONS: readonly Option[] = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "status", label: "Por estado" },
];

export function ActivitiesSection({
  activities,
  filteredActivities,
  pageItems,
  recruiters,
  isAdmin,
  currentUserId,
  statusFilter,
  searchQuery,
  sortOrder,
  recruiterFilter,
  statusCounts,
  pagination,
  isNew,
  onStatusFilterChange,
  onSearchQueryChange,
  onSortOrderChange,
  onRecruiterFilterChange,
  onClearFilters,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
  onViewReference,
}: ActivitiesSectionProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const countLabel = `${activities.length} ${activities.length === 1 ? (en ? "activity" : "actividad") : (en ? "activities" : "actividades")}`;
  const statusFilters = en ? [
    { key: "todas", label: "All" }, { key: "pendiente", label: "Pending" },
    { key: "en_proceso", label: "In progress" }, { key: "completada", label: "Completed" },
  ] as typeof STATUS_FILTERS : STATUS_FILTERS;
  const sortOptions = en ? [
    { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" },
    { value: "status", label: "By status" },
  ] : SORT_OPTIONS;

  return (
    <section
      className="activity-tracking-section"
      aria-labelledby="activity-tracking-heading"
    >
      <header className="activity-tracking-section__header">
        <div className="activity-tracking-section__heading">
          <h2
            id="activity-tracking-heading"
            className="activity-tracking-section__title"
          >
            <span>{en ? "Activities" : "Actividades"}</span>
            <span
              className="activity-tracking-section__count"
              aria-label={countLabel}
            >
              {activities.length}
            </span>
          </h2>
          <p className="activity-tracking-section__description">
            {en ? "Track progress and evidence." : "Seguimiento con avance y evidencias."}
          </p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm" onClick={onCreate}>
            <Plus size="var(--icon-size-sm)" aria-hidden="true" />
            <span>{en ? "Create" : "Crear"}</span>
          </button>
        )}
      </header>

      <div
        id="actividades-panel"
        className="activity-tracking-section__panel"
      >
        {activities.length > 0 && (
          <Toolbar label={en ? "Activity filters" : "Filtros de actividades"}>
            <ToolbarGroup
              className="activity-tracking-section__status-filters"
              label={en ? "Filter by status" : "Filtrar por estado"}
            >
              {statusFilters.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={statusFilter === key}
                  className="activity-tracking-section__status-filter"
                  onClick={() => onStatusFilterChange(key)}
                >
                  <span className="activity-tracking-section__filter-content">
                    <span>{label}</span>
                    <span className="activity-tracking-section__filter-count">
                      {statusCounts[key]}
                    </span>
                  </span>
                </button>
              ))}
            </ToolbarGroup>

            <ToolbarGroup
              className="activity-tracking-section__filters"
              label={en ? "Search and sort activities" : "Buscar y ordenar actividades"}
            >
              <div className="activity-tracking-section__search">
                <label className="sr-only" htmlFor="activity-search">
                  {en ? "Search activities" : "Buscar actividades"}
                </label>
                <Search
                  size="var(--icon-size-sm)"
                  className="activity-tracking-section__search-icon"
                  aria-hidden="true"
                />
                <input
                  id="activity-search"
                  type="search"
                  className="activity-tracking-section__search-input"
                  placeholder={en ? "Search by title or description..." : "Buscar por título o descripción..."}
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </div>

              <label className="sr-only" htmlFor="activity-sort">
                {en ? "Sort activities" : "Ordenar actividades"}
              </label>
              <CustomSelect
                id="activity-sort"
                className="activity-tracking-section__select"
                value={sortOrder}
                onChange={(value) => {
                  if (value === "newest" || value === "oldest" || value === "status") {
                    onSortOrderChange(value);
                  }
                }}
                options={sortOptions}
                showPlaceholderOption={false}
              />

              {isAdmin && recruiters.length > 0 && (
                <>
                  <label className="sr-only" htmlFor="activity-recruiter">
                    {en ? "Filter by recruiter" : "Filtrar por reclutador"}
                  </label>
                  <CustomSelect
                    id="activity-recruiter"
                    className="activity-tracking-section__select"
                    value={recruiterFilter}
                    onChange={onRecruiterFilterChange}
                    options={[
                      { value: "", label: en ? "All" : "Todos" },
                      { value: "__team__", label: en ? "Whole team" : "Todo el equipo" },
                      ...recruiters.map((recruiter) => ({
                        value: recruiter.id,
                        label: recruiter.display_name || recruiter.username || "",
                      })),
                    ]}
                    showPlaceholderOption={false}
                  />
                </>
              )}
            </ToolbarGroup>
          </Toolbar>
        )}

        {activities.length === 0 ? (
          <div className="activity-tracking-section__empty">
            <Inbox
              size="var(--icon-size-xxl)"
              className="activity-tracking-section__empty-icon"
              aria-hidden="true"
            />
            <p className="activity-tracking-section__empty-title">
              {en ? "No activities" : "Sin actividades"}
            </p>
            <p className="activity-tracking-section__empty-description">
              {isAdmin
                ? (en ? "Assign an activity to track its progress." : "Asigna una actividad para dar seguimiento.")
                : (en ? "You have no assigned activities." : "No tienes actividades asignadas.")}
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activity-tracking-section__empty">
            <Search
              size="var(--icon-size-xxl)"
              className="activity-tracking-section__empty-icon"
              aria-hidden="true"
            />
            <p className="activity-tracking-section__empty-title">
              {en ? "No matches" : "Sin coincidencias"}
            </p>
            <p className="activity-tracking-section__empty-description">
              {en ? "No activities match the selected filters." : "No hay actividades que coincidan con los filtros aplicados."}
            </p>
            <button
              type="button"
              className="btn-ghost activity-tracking-section__clear"
              onClick={onClearFilters}
            >
              {en ? "Clear filters" : "Limpiar filtros"}
            </button>
          </div>
        ) : (
          <div
            className="activity-tracking-section__grid"
            role="list"
            aria-label={en ? "Activities" : "Actividades"}
          >
            {pageItems.map((activity) => {
              const activityWithAssignee = activity as ActivityWithAssignee;
              const assignee = activity.asignado_a
                ? {
                    id: activity.asignado_a,
                    display_name:
                      activityWithAssignee.asignado_a_profile?.display_name,
                    username:
                      activityWithAssignee.asignado_a_profile?.username,
                  }
                : undefined;

              return (
                <ActivityCard
                  key={activity.id}
                  title={activity.titulo}
                  description={activity.descripcion ?? undefined}
                  status={activity.estado}
                  assignee={assignee}
                  referenceImage={activity.reference_image ?? undefined}
                  isNew={isNew(activity)}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  onClick={() => onOpen(activity)}
                  onEdit={() => onEdit(activity)}
                  onDelete={() => onDelete(activity)}
                  onViewReference={() => {
                    if (activity.reference_image) {
                      onViewReference(activity.reference_image);
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onPrev={pagination.onPrev}
          onNext={pagination.onNext}
          canGoPrev={pagination.canGoPrev}
          canGoNext={pagination.canGoNext}
          ariaLabel={en ? "Activity pages" : "Paginación de actividades"}
          sticky
          hideOnSinglePage
        />
      </div>
    </section>
  );
}
