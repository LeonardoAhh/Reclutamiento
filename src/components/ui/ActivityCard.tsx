import { EllipsisVertical, Trash2, PenLine, Image as ImageIcon, CircleCheckBig, Clock, CircleDashed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ReclutadorBadge } from "@/components/ui/ReclutadorBadge";
import "./ActivityCard.css";

export interface ActivityCardProps {
  id: string;
  title: string;
  description?: string;
  status: "pendiente" | "en_proceso" | "completada";
  assignees?: Array<{ id: string; display_name?: string; username?: string }>;
  referenceImage?: string;
  isNew?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewReference?: () => void;
}

const STATUS_LABEL: Record<ActivityCardProps["status"], string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
};

const STATUS_ICON: Record<ActivityCardProps["status"], React.ElementType> = {
  pendiente: CircleDashed,
  en_proceso: Clock,
  completada: CircleCheckBig,
};

export function ActivityCard({
  id,
  title,
  description,
  status,
  assignees = [],
  referenceImage,
  isNew = false,
  isAdmin = false,
  currentUserId,
  onClick,
  onEdit,
  onDelete,
  onViewReference,
}: ActivityCardProps) {
  const filteredAssignees = assignees.filter(
    (a) => !currentUserId || a.id !== currentUserId,
  );

  const Icon = STATUS_ICON[status];

  return (
    <article className="activity-card" role="listitem">
      <button
        type="button"
        className="activity-card__open"
        onClick={onClick}
        aria-label={`Consultar ${title}`}
      />
      {isNew && <span className="activity-new-badge">Nueva</span>}

      <div className="activity-card-main">
        <div className={`activity-icon status-${status}`}>
          <Icon size={18} aria-hidden="true" />
        </div>

        <div className="activity-content">
          <div className="activity-title-row">
            <h3 className="activity-title"><span className="activity-title-text">{title}</span></h3>
            <span className={`activity-status ${status}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          {description?.trim() ? (
            <p 
              className="activity-desc" 
              data-full={description.trim()}
            >
              <span className="activity-desc-text">{description.trim()}</span>
            </p>
          ) : (
            <p className="activity-desc activity-desc--muted">
              <span className="activity-desc-text">Sin descripción</span>
            </p>
          )}

          <div className="activity-assignees">
            {filteredAssignees.length > 0 ? (
              filteredAssignees.slice(0, 2).map((assignee) => (
                <ReclutadorBadge
                  key={assignee.id}
                  nombre={assignee.display_name || assignee.username || "—"}
                  size="sm"
                  showRole={false}
                />
              ))
            ) : (
              <span className="activity-assignees--empty">Todo el equipo</span>
            )}
            {filteredAssignees.length > 2 && (
              <span className="activity-assignees-more">
                +{filteredAssignees.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {referenceImage && (
        <div className="activity-card-right">
          <button
            type="button"
            className="activity-ref-button"
            onClick={(e) => {
              e.stopPropagation();
              onViewReference?.();
            }}
            aria-label={`Ver imagen de referencia de ${title}`}
          >
            <ImageIcon size={16} aria-hidden="true" />
            <img
              src={referenceImage}
              alt=""
              className="activity-ref-img"
              loading="lazy"
            />
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="activity-admin-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Opciones"
              >
                <EllipsisVertical size={16} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onEdit && (
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <PenLine aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {onEdit && <DropdownMenuSeparator />}
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
    </article>
  );
}
