import {
  Clock3,
  Paperclip,
  SquarePen,
  Trash2,
  UserRound,
} from "lucide-react";
import { TruncatedTextPopover } from "@/components/ui/TruncatedTextPopover";
import { formatDailyWorkTime } from "./format";
import type { DailyWorkActivity } from "./types";

interface DailyWorkActivityCardProps {
  activity: DailyWorkActivity;
  showRecruiter: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onOpenAttachments: () => void;
  onDelete: () => void;
}

export function DailyWorkActivityCard({
  activity,
  showRecruiter,
  canEdit,
  canDelete,
  onEdit,
  onOpenAttachments,
  onDelete,
}: DailyWorkActivityCardProps) {
  const timeLabel =
    activity.startTime && activity.endTime
      ? `${formatDailyWorkTime(activity.startTime)}–${formatDailyWorkTime(activity.endTime)}`
      : "Sin horario específico";

  return (
    <article className="daily-work-card" role="listitem">
      <header className="daily-work-card__header">
        <dl className="daily-work-card__meta">
          <div>
            <dt className="sr-only">Horario</dt>
            <dd>
              <Clock3 size="var(--icon-size-sm)" aria-hidden="true" />
              {timeLabel}
            </dd>
          </div>
          {showRecruiter && (
            <div>
              <dt className="sr-only">Reclutador</dt>
              <dd>
                <UserRound size="var(--icon-size-sm)" aria-hidden="true" />
                {activity.recruiterName}
              </dd>
            </div>
          )}
        </dl>

        {(canEdit || activity.attachments.length > 0 || canDelete) && (
          <div className="daily-work-card__actions">
            {canEdit && (
              <button
                type="button"
                className="btn-icon"
                onClick={onEdit}
                aria-label={`Editar actividad: ${activity.description}`}
              >
                <SquarePen size="var(--icon-size-sm)" aria-hidden="true" />
              </button>
            )}
            {activity.attachments.length > 0 && (
              <button
                type="button"
                className="btn-icon"
                onClick={onOpenAttachments}
                aria-label={`Ver ${activity.attachments.length} ${activity.attachments.length === 1 ? "archivo adjunto" : "archivos adjuntos"}`}
                aria-haspopup="dialog"
              >
                <Paperclip size="var(--icon-size-sm)" aria-hidden="true" />
                <span className="btn-icon__count" aria-hidden="true">
                  {activity.attachments.length}
                </span>
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                onClick={onDelete}
                aria-label={`Eliminar actividad de ${activity.recruiterName}`}
              >
                <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </header>

      <section
        className="daily-work-card__body"
        aria-label="Actividad realizada"
      >
        <TruncatedTextPopover
          text={activity.description}
          className="daily-work-card__description"
        />
      </section>

    </article>
  );
}
