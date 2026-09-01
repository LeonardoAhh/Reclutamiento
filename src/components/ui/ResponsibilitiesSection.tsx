import { ChevronDown, ChevronRight, ListRestart, Plus } from "lucide-react";
import type { Activity } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { ResponsabilidadCard } from "@/components/ui/ResponsabilidadCard";
import "./ResponsibilitiesSection.css";

interface ResponsibilitiesPagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

interface ResponsibilitiesSectionProps {
  responsibilities: Activity[];
  pageItems: Activity[];
  isCollapsed: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  pagination: ResponsibilitiesPagination;
  isNew: (activity: Activity) => boolean;
  onToggle: () => void;
  onCreate: () => void;
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

function getResponsibilityContent(activity: Activity) {
  const rawDescription = activity.descripcion ?? "";
  if (!rawDescription.includes(" - ")) {
    return {
      area: undefined,
      description: rawDescription || undefined,
    };
  }

  const [area, ...descriptionParts] = rawDescription.split(" - ");
  return {
    area: area || undefined,
    description: descriptionParts.join(" - ") || undefined,
  };
}

export function ResponsibilitiesSection({
  responsibilities,
  pageItems,
  isCollapsed,
  isAdmin,
  currentUserId,
  pagination,
  isNew,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
  onViewReference,
}: ResponsibilitiesSectionProps) {
  const countLabel = `${responsibilities.length} ${responsibilities.length === 1 ? "responsabilidad" : "responsabilidades"}`;

  return (
    <section
      className="responsibilities-section"
      aria-labelledby="responsibilities-heading"
    >
      <header className="responsibilities-section__header">
        <div className="responsibilities-section__heading">
          <h2
            id="responsibilities-heading"
            className="responsibilities-section__title"
          >
            <button
              type="button"
              className="responsibilities-section__toggle"
              onClick={onToggle}
              aria-expanded={!isCollapsed}
              aria-controls="responsabilidades-panel"
            >
              {isCollapsed ? (
                <ChevronRight size="var(--icon-size-md)" aria-hidden="true" />
              ) : (
                <ChevronDown size="var(--icon-size-md)" aria-hidden="true" />
              )}
              <span>Responsabilidades</span>
            </button>
            <span
              className="responsibilities-section__count"
              aria-label={countLabel}
            >
              {responsibilities.length}
            </span>
          </h2>
          <p className="responsibilities-section__description">
            De manera recurrente, sin seguimiento de evidencias.
          </p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm" onClick={onCreate}>
            <Plus size="var(--icon-size-sm)" aria-hidden="true" />
            <span>Crear</span>
          </button>
        )}
      </header>

      <div
        id="responsabilidades-panel"
        className="responsibilities-section__panel"
        hidden={isCollapsed}
      >
        {responsibilities.length === 0 ? (
          <div className="responsibilities-section__empty">
            <ListRestart
              size="var(--icon-size-xxl)"
              className="responsibilities-section__empty-icon"
              aria-hidden="true"
            />
            <p className="responsibilities-section__empty-title">
              Sin responsabilidades
            </p>
            <p className="responsibilities-section__empty-description">
              {isAdmin
                ? 'Crea una actividad tipo "Rutina" para asignarla.'
                : "Aún no tienes responsabilidades asignadas."}
            </p>
          </div>
        ) : (
          <>
            <div
              className="responsibilities-section__grid"
              role="list"
              aria-label="Responsabilidades"
            >
              {pageItems.map((activity) => {
                const content = getResponsibilityContent(activity);
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
                  <ResponsabilidadCard
                    key={activity.id}
                    title={activity.titulo}
                    description={content.description}
                    area={content.area}
                    assignee={assignee}
                    referenceImage={activity.reference_image ?? undefined}
                    isNew={isNew(activity)}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
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

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              onPrev={pagination.onPrev}
              onNext={pagination.onNext}
              canGoPrev={pagination.canGoPrev}
              canGoNext={pagination.canGoNext}
              ariaLabel="Paginación de responsabilidades"
            />
          </>
        )}
      </div>
    </section>
  );
}
