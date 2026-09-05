import { Inbox, Search } from "lucide-react";
import type { Activity, ActivityStatus } from "@/lib/types";
import { ActivityCard } from "@/components/ui/ActivityCard";
import { Pagination } from "@/components/ui/Pagination";
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
  onOpen,
  onEdit,
  onDelete,
  onViewReference,
}: ActivitiesSectionProps) {
  const countLabel = `${activities.length} ${activities.length === 1 ? "actividad" : "actividades"}`;

  return (
    <section
      className="activity-tracking-section"
      aria-labelledby="activity-tracking-heading"
    >
      <header className="activity-tracking-section__header">
        <h2
          id="activity-tracking-heading"
          className="activity-tracking-section__title"
        >
          <span>Actividades</span>
          <span
            className="activity-tracking-section__count"
            aria-label={countLabel}
          >
            {activities.length}
          </span>
        </h2>
        <p className="activity-tracking-section__description">
          Seguimiento con avance y evidencias.
        </p>
      </header>

      <div
        id="actividades-panel"
        className="activity-tracking-section__panel"
      >
        {activities.length > 0 && (
          <div className="activity-tracking-section__toolbar">
            <div
              className="activity-tracking-section__status-filters"
              role="group"
              aria-label="Filtrar por estado"
            >
              {STATUS_FILTERS.map(({ key, label }) => (
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
            </div>

            <div className="activity-tracking-section__filters">
              <div className="activity-tracking-section__search">
                <label className="sr-only" htmlFor="activity-search">
                  Buscar actividades
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
                  placeholder="Buscar por título o descripción..."
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </div>

              <label className="sr-only" htmlFor="activity-sort">
                Ordenar actividades
              </label>
              <select
                id="activity-sort"
                className="activity-tracking-section__select"
                value={sortOrder}
                onChange={(event) =>
                  onSortOrderChange(event.target.value as ActivitySortOrder)
                }
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguas</option>
                <option value="status">Por estado</option>
              </select>

              {isAdmin && recruiters.length > 0 && (
                <>
                  <label className="sr-only" htmlFor="activity-recruiter">
                    Filtrar por reclutador
                  </label>
                  <select
                    id="activity-recruiter"
                    className="activity-tracking-section__select"
                    value={recruiterFilter}
                    onChange={(event) =>
                      onRecruiterFilterChange(event.target.value)
                    }
                  >
                    <option value="">All</option>
                    <option value="__team__">Todo el equipo</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter.id} value={recruiter.id}>
                        {recruiter.display_name || recruiter.username}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="activity-tracking-section__empty">
            <Inbox
              size="var(--icon-size-xxl)"
              className="activity-tracking-section__empty-icon"
              aria-hidden="true"
            />
            <p className="activity-tracking-section__empty-title">
              Sin actividades
            </p>
            <p className="activity-tracking-section__empty-description">
              {isAdmin
                ? "Asigna una actividad para dar seguimiento."
                : "No tienes actividades asignadas."}
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
              Sin coincidencias
            </p>
            <p className="activity-tracking-section__empty-description">
              No hay actividades que coincidan con los filtros aplicados.
            </p>
            <button
              type="button"
              className="btn-ghost activity-tracking-section__clear"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div
            className="activity-tracking-section__grid"
            role="list"
            aria-label="Actividades"
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
          ariaLabel="Paginación de actividades"
        />
      </div>
    </section>
  );
}
