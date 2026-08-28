import { BriefcaseBusiness, EllipsisVertical, Trash2, UserRoundPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ReclutadorBadge } from "@/components/ui/ReclutadorBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import "./ActivityCard.css";

export interface VacanteCardProps {
  id: string;
  title: string;
  seccion?: string;
  assignees?: Array<{ id: string; display_name?: string; username?: string }>;
  isNew?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onAssign?: () => void;
  onDelete?: () => void;
}

export function VacanteCard({
  title,
  seccion,
  assignees = [],
  isNew = false,
  isAdmin = false,
  currentUserId,
  onAssign,
  onDelete,
}: VacanteCardProps) {
  const filteredAssignees = assignees.filter(
    (a) => !currentUserId || a.id !== currentUserId,
  );

  return (
    <article className="activity-card" role="listitem">
      <div className="activity-card__header">
        <div className="activity-card__title-wrap">
          {isNew && <span className="activity-new-badge">Nueva</span>}
          <h3 className="activity-card__title" title={title}>{title}</h3>
        </div>
        {isAdmin && (
          <div className="activity-card__menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Opciones"
                  className="activity-card__menu-btn"
                >
                  <EllipsisVertical size="var(--icon-size-sm)" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onAssign && (
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign();
                      }}
                    >
                      <UserRoundPlus aria-hidden="true" />
                      <span>Asignar a...</span>
                    </button>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    {onAssign && <DropdownMenuSeparator />}
                    <DropdownMenuItem asChild>
                      <button
                        type="button"
                        className="dropdown-menu-item--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="activity-card__body">
        {seccion?.trim() && (
          <Tooltip content={seccion.trim()}>
            <p className="activity-card__desc activity-card__desc--muted">{seccion.trim()}</p>
          </Tooltip>
        )}
      </div>

      <div className="activity-card__footer">
        <div className="activity-card__status activity-card__status--en_proceso">
          <BriefcaseBusiness size={14} aria-hidden="true" />
          <span>Vacante</span>
        </div>

        <div className="activity-card__assignees">
          {filteredAssignees.length > 0 ? (
            filteredAssignees.slice(0, 3).map((assignee) => (
              <ReclutadorBadge
                key={assignee.id}
                nombre={assignee.display_name || assignee.username || "—"}
                size="sm"
                showRole={false}
              />
            ))
          ) : (
            <span className="activity-card__assignees-empty">Sin asignar</span>
          )}
          {filteredAssignees.length > 3 && (
            <span className="activity-card__assignees-more">
              +{filteredAssignees.length - 3}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
