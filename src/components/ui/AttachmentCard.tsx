import { useEffect, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  onRemove?: () => void | Promise<boolean | void>;
  confirmRemove?: boolean;
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
  confirmRemove = false,
  removeLabel,
  removeIcon,
}: AttachmentCardProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { language } = useLanguage();
  const en = language === "en";
  useEffect(() => { setConfirmingRemove(false); }, [imageSrc, href]);

  const handleRemove = async () => {
    if (!onRemove || removing) return;
    if (confirmRemove && !confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    setRemoving(true);
    try {
      if (await onRemove() !== false) setConfirmingRemove(false);
    } finally {
      setRemoving(false);
    }
  };
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

      {onRemove && <div className="attachment-card__remove-actions">
        {confirmingRemove && <button type="button" className="attachment-card__remove"
          disabled={removing} onClick={() => setConfirmingRemove(false)}
          aria-label={en ? `Cancel removal of ${name}` : `Cancelar eliminación de ${name}`}>
          <X size="var(--icon-size-sm)" aria-hidden="true" />
        </button>}
        <button type="button" className="attachment-card__remove"
          disabled={removing} aria-busy={removing} onClick={() => void handleRemove()}
          aria-label={confirmingRemove
            ? `${en ? "Confirm removal of" : "Confirmar eliminación de"} ${name}`
            : removeLabel ?? `Quitar ${name}`}>
          {confirmingRemove ? <Check size="var(--icon-size-sm)" aria-hidden="true" /> : removeIcon}
        </button>
      </div>}
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
