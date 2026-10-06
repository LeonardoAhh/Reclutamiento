import { EllipsisVertical, ListRestart, SquarePen, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <article className="card responsibility-card" role="listitem">
      {isNew && (
        <span className="responsibility-card__status">{en ? "New" : "Nueva"}</span>
      )}
      <header className="responsibility-card__header">
        <div className="responsibility-card__icon">
          <ListRestart size="var(--icon-size-md)" aria-hidden="true" />
        </div>

        <div className="responsibility-card__heading">
          <div className="responsibility-card__title-row">
            <h3 className="responsibility-card__title">{title}</h3>
          </div>
        </div>

        {isAdmin && (onEdit || onDelete) && (
          <div className="responsibility-card__actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="responsibility-card__menu"
                  aria-label={`${en ? "Options for" : "Opciones de"} ${title}`}
                >
                  <EllipsisVertical
                    size="var(--icon-size-sm)"
                    aria-hidden="true"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onEdit && (
                  <DropdownMenuItem asChild onSelect={onEdit}>
                    <button type="button">
                      <SquarePen aria-hidden="true" />
                      <span>{en ? "Edit" : "Editar"}</span>
                    </button>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    {onEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      asChild
                      variant="destructive"
                      onSelect={onDelete}
                    >
                      <button type="button">
                        <Trash2 aria-hidden="true" />
                        <span>{en ? "Delete" : "Eliminar"}</span>
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
            <span className="sr-only">{en ? "Area:" : "Área:"}</span>
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
