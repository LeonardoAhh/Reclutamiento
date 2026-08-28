import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import "./AttachmentCard.css";

interface AttachmentCardProps {
  name: string;
  metadata: string;
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
    <FileText
      className="attachment-card__file-icon"
      size="var(--icon-size-md)"
      aria-hidden="true"
    />
  );

  return (
    <div className="attachment-card">
      {onPreview ? (
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
        <span className="attachment-card__name" title={name}>
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
    </div>
  );
}
