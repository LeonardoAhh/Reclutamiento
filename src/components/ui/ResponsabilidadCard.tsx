import { CircleCheckBig, EllipsisVertical, Trash2, SquarePen, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ReclutadorBadge } from "@/components/ui/ReclutadorBadge";
import "./ResponsabilidadCard.css";

export interface ResponsabilidadCardProps {
  id: string;
  title: string;
  description?: string;
  area?: string;
  assignees?: Array<{ id: string; display_name?: string; username?: string }>;
  referenceImage?: string;
  isNew?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewReference?: () => void;
}

export function ResponsabilidadCard({
  id,
  title,
  description,
  area,
  assignees = [],
  referenceImage,
  isNew = false,
  isAdmin = false,
  currentUserId,
  onClick,
  onEdit,
  onDelete,
  onViewReference,
}: ResponsabilidadCardProps) {
  const filteredAssignees = assignees.filter(
    (a) => !currentUserId || a.id !== currentUserId,
  );

  return (
    <div className="responsabilidad-card" role="listitem">
      {isNew && <span className="activity-new-badge">Nueva</span>}

      <div className="responsabilidad-card-main">
        <div className="responsabilidad-icon">
          <CircleCheckBig size="var(--icon-size-md)" aria-hidden="true" />
        </div>

        <div className="responsabilidad-content">
          <h3 className="responsabilidad-title"><span className="responsabilidad-title-text">{title}</span></h3>
          {description && (
            <p 
              className="responsabilidad-desc" 
              data-full={description}
            >
              <span className="responsabilidad-desc-text">{description}</span>
            </p>
          )}
          {area && (
            <p 
              className="responsabilidad-desc responsabilidad-desc--muted" 
              data-full={area}
            >
              <span className="responsabilidad-desc-text">{area}</span>
            </p>
          )}
          <div className="responsabilidad-badge">
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
              <span className="responsabilidad-badge--team">Todo el equipo</span>
            )}
            {filteredAssignees.length > 2 && (
              <span className="responsabilidad-badge-more">
                +{filteredAssignees.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {referenceImage && (
        <div className="responsabilidad-card-right">
          <button
            type="button"
            className="responsabilidad-ref-button"
            onClick={(e) => {
              e.stopPropagation();
              onViewReference?.();
            }}
            aria-label={`Ampliar referencia de ${title}`}
          >
            <ImageIcon size="var(--icon-size-sm)" aria-hidden="true" />
            <img
              src={referenceImage}
              alt=""
              className="responsabilidad-ref-img"
            />
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="activity-admin-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Opciones">
                <EllipsisVertical size="var(--icon-size-sm)" aria-hidden="true" />
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
                    <SquarePen aria-hidden="true" />
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
    </div>
  );
}
