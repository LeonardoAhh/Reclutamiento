import { Inbox, Plus, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Activity, ActivityStatus } from "@/lib/types";
import { ActivityCard } from "@/components/ui/ActivityCard";
import { Pagination } from "@/components/ui/Pagination";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import "./ActivitiesSection.css";

type ActivityStatusFilter = ActivityStatus | "todas";

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
  isAdmin: boolean;
  currentUserId?: string;
  statusFilter: ActivityStatusFilter;
  statusCounts: Record<ActivityStatusFilter, number>;
  pagination: ActivitiesPagination;
  isNew: (activity: Activity) => boolean;
  onStatusFilterChange: (status: ActivityStatusFilter) => void;
  onClearFilters: () => void;
  onCreate: () => void;
  onOpen: (activity: Activity) => void;
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
  isAdmin,
  currentUserId,
  statusFilter,
  statusCounts,
  pagination,
  isNew,
  onStatusFilterChange,
  onClearFilters,
  onCreate,
  onOpen,
}: ActivitiesSectionProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const statusFilters = en ? [
    { key: "todas", label: "All" }, { key: "pendiente", label: "Pending" },
    { key: "en_proceso", label: "In progress" }, { key: "completada", label: "Completed" },
  ] as typeof STATUS_FILTERS : STATUS_FILTERS;

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
          {en ? "Activities" : "Actividades"}
        </h2>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm activities-create-action" onClick={onCreate}>
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
          <div className="assignment-results activity-tracking-section__results">
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
                    currentUserId={currentUserId}
                    onClick={() => onOpen(activity)}
                  />
                );
              })}
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              onPrev={pagination.onPrev}
              onNext={pagination.onNext}
              canGoPrev={pagination.canGoPrev}
              canGoNext={pagination.canGoNext}
              ariaLabel={en ? "Activity pages" : "Paginación de actividades"}
              hideOnSinglePage
            />
          </div>
        )}
      </div>
    </section>
  );
}
