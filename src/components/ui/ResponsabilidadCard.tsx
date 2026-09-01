import { EllipsisVertical, ListRestart, SquarePen, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { AssignmentMeta } from "@/components/ui/AssignmentMeta";
import { ReferenceAttachment } from "@/components/ui/ReferenceAttachment";
import "./ResponsabilidadCard.css";

export interface ResponsabilidadCardProps {
  title: string;
  description?: string;
  area?: string;
  assignee?: { id: string; display_name?: string | null; username?: string | null };
  referenceImage?: string;
  isNew?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewReference?: () => void;
}

export function ResponsabilidadCard({
  title,
  description,
  area,
  assignee,
  referenceImage,
  isNew = false,
  isAdmin = false,
  currentUserId,
  onEdit,
  onDelete,
  onViewReference,
}: ResponsabilidadCardProps) {
  return (
    <article className="responsibility-card" role="listitem">
      <header className="responsibility-card__header">
        <div className="responsibility-card__icon">
          <ListRestart size="var(--icon-size-md)" aria-hidden="true" />
        </div>

        <div className="responsibility-card__heading">
          <div className="responsibility-card__title-row">
            <h3 className="responsibility-card__title">{title}</h3>
            {isNew && (
              <span className="responsibility-card__status">Nueva</span>
            )}
          </div>
        </div>

        {isAdmin && (onEdit || onDelete) && (
          <div className="responsibility-card__actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="responsibility-card__menu"
                  aria-label={`Opciones de ${title}`}
                >
                  <EllipsisVertical
                    size="var(--icon-size-sm)"
                    aria-hidden="true"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onEdit && (
                  <DropdownMenuItem asChild>
                    <button type="button" onClick={onEdit}>
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
                        onClick={onDelete}
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
      </header>

      {description && (
        <p className="responsibility-card__description">{description}</p>
      )}

      <footer className="responsibility-card__footer">
        {area && (
          <p className="responsibility-card__area">
            <span className="sr-only">Área:</span>
            {area}
          </p>
        )}
        <AssignmentMeta assignee={assignee} currentUserId={currentUserId} />
        {referenceImage && onViewReference && (
          <ReferenceAttachment
            src={referenceImage}
            contextLabel={title}
            onOpen={onViewReference}
          />
        )}
      </footer>
    </article>
  );
}
