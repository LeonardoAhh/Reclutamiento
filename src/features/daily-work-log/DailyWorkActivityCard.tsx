import { Clock3, Paperclip, SquarePen, UserRound } from "lucide-react";
import { AttachmentCard } from "@/components/ui/AttachmentCard";
import {
  formatDailyWorkFileSize,
  formatDailyWorkTime,
  isDailyWorkImage,
} from "./format";
import type { DailyWorkActivity } from "./types";

interface DailyWorkActivityCardProps {
  activity: DailyWorkActivity;
  showRecruiter: boolean;
  canEdit: boolean;
  onEdit: () => void;
}

export function DailyWorkActivityCard({
  activity,
  showRecruiter,
  canEdit,
  onEdit,
}: DailyWorkActivityCardProps) {
  const timeLabel =
    activity.startTime && activity.endTime
      ? `${formatDailyWorkTime(activity.startTime)}–${formatDailyWorkTime(activity.endTime)}`
      : "Sin horario específico";

  return (
    <article className="daily-work-card" role="listitem">
      <header className="daily-work-card__header">
        <div className="daily-work-card__meta">
          <span>
            <Clock3 size="var(--icon-size-sm)" aria-hidden="true" />
            {timeLabel}
          </span>
          {showRecruiter && (
            <span>
              <UserRound size="var(--icon-size-sm)" aria-hidden="true" />
              {activity.recruiterName}
            </span>
          )}
        </div>

        {canEdit && (
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onEdit}
            aria-label={`Editar actividad: ${activity.description}`}
          >
            <SquarePen size="var(--icon-size-sm)" aria-hidden="true" />
            <span>Editar</span>
          </button>
        )}
      </header>

      <p className="daily-work-card__description">{activity.description}</p>

      {activity.attachments.length > 0 && (
        <section
          className="daily-work-card__attachments"
          aria-labelledby={`daily-work-files-${activity.id}`}
        >
          <h3 id={`daily-work-files-${activity.id}`}>
            <Paperclip size="var(--icon-size-sm)" aria-hidden="true" />
            Archivos ({activity.attachments.length})
          </h3>
          <div className="daily-work-card__file-list">
            {activity.attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                name={attachment.fileName}
                metadata={formatDailyWorkFileSize(attachment.sizeBytes)}
                imageSrc={
                  isDailyWorkImage(attachment.mimeType)
                    ? attachment.signedUrl
                    : undefined
                }
                href={attachment.signedUrl}
                previewLabel={`Abrir ${attachment.fileName}`}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
