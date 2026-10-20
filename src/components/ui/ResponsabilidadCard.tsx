import { ListRestart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssignmentMeta } from "@/components/ui/AssignmentMeta";
import { Badge } from "@/components/ui/Badge";
import "./ResponsabilidadCard.css";

export interface ResponsabilidadCardProps {
  title: string;
  description?: string;
  area?: string;
  assignee?: { id: string; display_name?: string | null; username?: string | null };
  isNew?: boolean;
  currentUserId?: string;
  onOpen: () => void;
}

export function ResponsabilidadCard({
  title,
  description,
  area,
  assignee,
  isNew = false,
  currentUserId,
  onOpen,
}: ResponsabilidadCardProps) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <article className="card responsibility-card" role="listitem">
      <button type="button" className="responsibility-card__open" onClick={onOpen}
        aria-label={`${en ? "View" : "Ver"}: ${title}`} />
      <div className="responsibility-card__content">
      {isNew && (
        <Badge className="badge--compact responsibility-card__status" data-state="new">{en ? "New" : "Nueva"}</Badge>
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
        <AssignmentMeta assignee={assignee} currentUserId={currentUserId} appearance="compact" />
      </footer>
      </div>
    </article>
  );
}
