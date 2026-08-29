import {
  BriefcaseBusiness,
  EllipsisVertical,
  Plus,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import type { Activity, AuthorizedPosition } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { AssignmentMeta } from "@/components/ui/AssignmentMeta";
import "./VacancyAssignmentSection.css";

interface VacancyAssignmentSectionProps {
  vacancies: Activity[];
  positions: AuthorizedPosition[];
  isAdmin: boolean;
  currentUserId?: string;
  isNew: (vacancy: Activity) => boolean;
  onCreate: () => void;
  onAssign: (vacancy: Activity) => void;
  onDelete: (vacancy: Activity) => void;
}

interface ActivityWithAssignee extends Activity {
  asignado_a_profile?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

export function VacancyAssignmentSection({
  vacancies,
  positions,
  isAdmin,
  currentUserId,
  isNew,
  onCreate,
  onAssign,
  onDelete,
}: VacancyAssignmentSectionProps) {
  const countLabel = `${vacancies.length} ${vacancies.length === 1 ? "vacante" : "vacantes"}`;

  return (
    <section
      className="vacancy-assignment-section"
      aria-labelledby="vacancy-assignment-heading"
    >
      <header className="vacancy-assignment-section__header">
        <div className="vacancy-assignment-section__heading">
          <h2
            id="vacancy-assignment-heading"
            className="vacancy-assignment-section__title"
          >
            {isAdmin ? "Asignación de Vacantes" : "Tus Vacantes"}
            <span
              className="vacancy-assignment-section__count"
              aria-label={countLabel}
            >
              {vacancies.length}
            </span>
          </h2>
          <p className="vacancy-assignment-section__description">
            {isAdmin
              ? "Asigna las vacantes activas a los reclutadores del equipo."
              : "Vacantes que te han sido asignadas."}
          </p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm" onClick={onCreate}>
            <Plus size="var(--icon-size-sm)" aria-hidden="true" />
            <span>Nueva</span>
          </button>
        )}
      </header>

      {vacancies.length === 0 ? (
        <div className="vacancy-assignment-section__empty">
          <BriefcaseBusiness
            size="var(--icon-size-xxl)"
            className="vacancy-assignment-section__empty-icon"
            aria-hidden="true"
          />
          <p className="vacancy-assignment-section__empty-title">
            Sin vacantes
          </p>
          <p className="vacancy-assignment-section__empty-description">
            Crea una nueva asignación de vacante manualmente.
          </p>
        </div>
      ) : (
        <div className="vacancy-assignment-grid" role="list">
          {vacancies.map((vacancy) => {
            const vacancyWithAssignee = vacancy as ActivityWithAssignee;
            const [area, ...sectionParts] = (vacancy.descripcion || "").split(
              " - ",
            );
            let section = sectionParts.join(" - ");

            if (!section) {
              const match = positions.find(
                (position) =>
                  position.area === area && position.puesto === vacancy.titulo,
              );
              if (match?.seccion) section = match.seccion;
            }

            return (
              <article
                key={vacancy.id}
                className="vacancy-assignment-card"
                role="listitem"
              >
                <div className="vacancy-assignment-card__body">
                  <div className="vacancy-assignment-card__icon">
                    <BriefcaseBusiness
                      size="var(--icon-size-md)"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="vacancy-assignment-card__content">
                    <div className="vacancy-assignment-card__title-row">
                      <h3 className="vacancy-assignment-card__title">
                        {vacancy.titulo}
                      </h3>
                      {isNew(vacancy) && (
                        <span className="vacancy-assignment-card__status">
                          Nueva
                        </span>
                      )}
                    </div>
                    {section && (
                      <p className="vacancy-assignment-card__section">
                        {section}
                      </p>
                    )}
                  </div>
                </div>

                <footer className="vacancy-assignment-card__footer">
                  <AssignmentMeta
                    assignee={
                      vacancy.asignado_a
                        ? {
                            id: vacancy.asignado_a,
                            display_name:
                              vacancyWithAssignee.asignado_a_profile
                                ?.display_name,
                            username:
                              vacancyWithAssignee.asignado_a_profile?.username,
                          }
                        : undefined
                    }
                    currentUserId={currentUserId}
                  />
                </footer>

                {isAdmin && (
                  <div className="vacancy-assignment-card__actions">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="vacancy-assignment-card__menu"
                          aria-label={`Opciones de ${vacancy.titulo}`}
                        >
                          <EllipsisVertical
                            size="var(--icon-size-sm)"
                            aria-hidden="true"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAssign(vacancy);
                            }}
                          >
                            <UserRoundPlus aria-hidden="true" />
                            <span>Asignar a...</span>
                          </button>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <button
                            type="button"
                            className="dropdown-menu-item--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(vacancy);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
