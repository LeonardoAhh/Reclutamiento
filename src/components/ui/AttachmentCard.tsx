import type { ReactNode } from "react";
import { AttachmentTypeIcon } from "./AttachmentTypeIcon";
import "./AttachmentCard.css";

interface AttachmentCardProps {
  name: string;
  metadata: string;
  variant?: "default" | "compact";
  isNameVisible?: boolean;
  isWholeCardInteractive?: boolean;
  mimeType?: string;
  imageSrc?: string;
  href?: string;
  onPreview?: () => void;
  previewLabel?: string;
  onRemove?: () => void;
  removeLabel?: string;
  removeIcon?: ReactNode;
}

export function AttachmentCard({
  name,
  metadata,
  variant = "default",
  isNameVisible = true,
  isWholeCardInteractive = false,
  mimeType,
  imageSrc,
  href,
  onPreview,
  previewLabel,
  onRemove,
  removeLabel,
  removeIcon,
}: AttachmentCardProps) {
  const previewContent = imageSrc ? (
    <img className="attachment-card__image" src={imageSrc} alt="" />
  ) : (
    <AttachmentTypeIcon mimeType={mimeType} />
  );
  const cardClassName = `attachment-card attachment-card--${variant}`;
  const useWholeCardLink =
    isWholeCardInteractive && Boolean(href) && !onPreview && !onRemove;

  const cardContent = (
    <>
      {useWholeCardLink ? (
        <span className="attachment-card__preview" aria-hidden="true">
          {previewContent}
        </span>
      ) : onPreview ? (
        <button
          type="button"
          className="attachment-card__preview attachment-card__preview--interactive"
          onClick={onPreview}
          aria-label={previewLabel ?? `Abrir ${name}`}
        >
          {previewContent}
        </button>
      ) : href ? (
        <a
          className="attachment-card__preview attachment-card__preview--interactive"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={previewLabel ?? `Abrir ${name}`}
        >
          {previewContent}
        </a>
      ) : (
        <div className="attachment-card__preview" aria-hidden="true">
          {previewContent}
        </div>
      )}

      <div className="attachment-card__info">
        <span
          className={isNameVisible ? "attachment-card__name" : "sr-only"}
          title={isNameVisible ? name : undefined}
        >
          {name}
        </span>
        <span className="attachment-card__metadata">{metadata}</span>
      </div>

      {onRemove && (
        <button
          type="button"
          className="attachment-card__remove"
          onClick={onRemove}
          aria-label={removeLabel ?? `Quitar ${name}`}
        >
          {removeIcon}
        </button>
      )}
    </>
  );

  if (useWholeCardLink && href) {
    return (
      <a
        className={`${cardClassName} attachment-card--interactive`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={previewLabel ?? `Abrir ${name}`}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div className={cardClassName}>{cardContent}</div>
  );
}
