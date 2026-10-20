import { BadgeCheck, CircleGauge, Clock3, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssignmentMeta } from "@/components/ui/AssignmentMeta";
import { Badge } from "@/components/ui/Badge";
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
  currentUserId?: string;
  onClick: () => void;
}

const STATUS_LABEL: Record<ActivityCardStatus, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
};

const STATUS_ICONS: Record<ActivityCardStatus, LucideIcon> = {
  pendiente: Clock3,
  en_proceso: CircleGauge,
  completada: BadgeCheck,
};

const BADGE_STATE: Record<ActivityCardStatus, string> = {
  pendiente: "pending",
  en_proceso: "in_progress",
  completada: "completed",
};

export function ActivityCard({
  title,
  description,
  status,
  assignee,
  referenceImage,
  isNew = false,
  currentUserId,
  onClick,
}: ActivityCardProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const normalizedDescription = description?.trim();
  const StatusIcon = STATUS_ICONS[status];

  return (
    <article className="card activity-card" role="listitem" data-status={status} data-has-image={Boolean(referenceImage)}>
      <button type="button" className="activity-card__open" onClick={onClick}
        aria-label={`${en ? "View" : "Consultar"} ${title}`} />
      {referenceImage && <img className="activity-card__cover" src={referenceImage} alt="" loading="lazy" />}
      <div className="activity-card__content">
      <header className="activity-card__header">
        <div className="activity-card__heading">
          <div className="activity-card__title-row">
            <div className="activity-card__meta-row">
              <div className="activity-card__badges">
                {isNew && <Badge className="badge--compact activity-card__new" data-state="new">{en ? "New" : "Nueva"}</Badge>}
              <Badge className="badge--compact activity-card__status" data-state={BADGE_STATE[status]}>
                <StatusIcon size="var(--icon-size-sm)" aria-hidden="true" />
                {en ? ({ pendiente: "Pending", en_proceso: "In progress", completada: "Completed" })[status] : STATUS_LABEL[status]}
              </Badge>
              </div>
              <AssignmentMeta assignee={assignee} currentUserId={currentUserId} appearance="compact" />
            </div>
            <h3 className="activity-card__title">{title}</h3>
          </div>
        </div>

      </header>

      <p
        className={`activity-card__description${normalizedDescription ? "" : " activity-card__description--muted"}`}
      >
        {normalizedDescription || (en ? "No description" : "Sin descripción")}
      </p>

      </div>
    </article>
  );
}
