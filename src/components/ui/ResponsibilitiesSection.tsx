import { ListRestart, Plus } from "lucide-react";
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

export interface AssignmentSectionCopy {
  headingId: string;
  panelId: string;
  title: string;
  singular: string;
  plural: string;
  description: string;
  emptyTitle: string;
  adminEmptyDescription: string;
  assigneeEmptyDescription: string;
  listLabel: string;
  paginationLabel: string;
}

export interface ResponsibilitiesSectionProps {
  responsibilities: Activity[];
  pageItems: Activity[];
  isAdmin: boolean;
  currentUserId?: string;
  pagination: ResponsibilitiesPagination;
  isNew: (activity: Activity) => boolean;
  onCreate: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onViewReference: (source: string) => void;
  copy?: AssignmentSectionCopy;
}

const RESPONSIBILITIES_COPY: AssignmentSectionCopy = {
  headingId: "responsibilities-heading",
  panelId: "responsabilidades-panel",
  title: "Responsabilidades",
  singular: "responsabilidad",
  plural: "responsabilidades",
  description: "De manera recurrente, sin seguimiento de evidencias.",
  emptyTitle: "Sin responsabilidades",
  adminEmptyDescription: 'Crea una actividad tipo "Responsabilidad" para asignarla.',
  assigneeEmptyDescription: "Aún no tienes responsabilidades asignadas.",
  listLabel: "Responsabilidades",
  paginationLabel: "Paginación de responsabilidades",
};

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
  isAdmin,
  currentUserId,
  pagination,
  isNew,
  onCreate,
  onEdit,
  onDelete,
  onViewReference,
  copy = RESPONSIBILITIES_COPY,
}: ResponsibilitiesSectionProps) {
  const countLabel = `${responsibilities.length} ${responsibilities.length === 1 ? copy.singular : copy.plural}`;

  return (
    <section
      className="responsibilities-section"
      aria-labelledby={copy.headingId}
    >
      <header className="responsibilities-section__header">
        <div className="responsibilities-section__heading">
          <h2
            id={copy.headingId}
            className="responsibilities-section__title"
          >
            <span>{copy.title}</span>
            <span
              className="responsibilities-section__count"
              aria-label={countLabel}
            >
              {responsibilities.length}
            </span>
          </h2>
          <p className="responsibilities-section__description">
            {copy.description}
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
        id={copy.panelId}
        className="responsibilities-section__panel"
      >
        {responsibilities.length === 0 ? (
          <div className="responsibilities-section__empty">
            <ListRestart
              size="var(--icon-size-xxl)"
              className="responsibilities-section__empty-icon"
              aria-hidden="true"
            />
            <p className="responsibilities-section__empty-title">
              {copy.emptyTitle}
            </p>
            <p className="responsibilities-section__empty-description">
              {isAdmin
                ? copy.adminEmptyDescription
                : copy.assigneeEmptyDescription}
            </p>
          </div>
        ) : (
          <>
            <div
              className="responsibilities-section__grid"
              role="list"
              aria-label={copy.listLabel}
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
              ariaLabel={copy.paginationLabel}
            />
          </>
        )}
      </div>
    </section>
  );
}
