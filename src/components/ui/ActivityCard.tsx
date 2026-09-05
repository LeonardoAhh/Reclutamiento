import {
  CircleCheckBig,
  CircleDashed,
  Clock,
  EllipsisVertical,
  SquarePen,
  Trash2,
} from "lucide-react";
import type { ElementType } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { AssignmentMeta } from "@/components/ui/AssignmentMeta";
import { ReferenceAttachment } from "@/components/ui/ReferenceAttachment";
import "./ActivityCard.css";

type ActivityCardStatus = "pendiente" | "en_proceso" | "completada";

export interface ActivityCardProps {
  title: string;
  description?: string;
  status: ActivityCardStatus;
  assignee?: {
    id: string;
    display_name?: string | null;
    username?: string | null;
  };
  referenceImage?: string;
  isNew?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewReference?: () => void;
}

const STATUS_LABEL: Record<ActivityCardStatus, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
};

const STATUS_ICON: Record<ActivityCardStatus, ElementType> = {
  pendiente: CircleDashed,
  en_proceso: Clock,
  completada: CircleCheckBig,
};

export function ActivityCard({
  title,
  description,
  status,
  assignee,
  referenceImage,
  isNew = false,
  isAdmin = false,
  currentUserId,
  onClick,
  onEdit,
  onDelete,
  onViewReference,
}: ActivityCardProps) {
  const Icon = STATUS_ICON[status];
  const normalizedDescription = description?.trim();

  return (
    <article className="activity-card" role="listitem" data-status={status}>
      {isNew && <span className="activity-card__new">Nueva</span>}
      <header className="activity-card__header">
        <div className="activity-card__icon">
          <Icon size="var(--icon-size-md)" aria-hidden="true" />
        </div>

        <div className="activity-card__heading">
          <div className="activity-card__title-row">
            <h3 className="activity-card__title">
              <button
                type="button"
                className="activity-card__open"
                onClick={onClick}
                aria-label={`Consultar ${title}`}
              >
                {title}
              </button>
            </h3>
            <span className="activity-card__status">
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {isAdmin && (onEdit || onDelete) && (
          <div className="activity-card__actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="activity-card__menu"
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

      <p
        className={`activity-card__description${normalizedDescription ? "" : " activity-card__description--muted"}`}
      >
        {normalizedDescription || "Sin descripción"}
      </p>

      <footer className="activity-card__footer">
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
