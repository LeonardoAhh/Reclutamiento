import { Maximize2 } from "lucide-react";
import "./ReferenceAttachment.css";

interface ReferenceAttachmentProps {
  src: string;
  contextLabel: string;
  onOpen: () => void;
}

export function ReferenceAttachment({
  src,
  contextLabel,
  onOpen,
}: ReferenceAttachmentProps) {
  return (
    <button
      type="button"
      className="reference-attachment"
      onClick={onOpen}
      aria-label={`Abrir referencia visual de ${contextLabel}`}
    >
      <span className="reference-attachment__preview" aria-hidden="true">
        <img
          src={src}
          alt=""
          className="reference-attachment__image"
          loading="lazy"
        />
      </span>
      <span className="reference-attachment__content">
        <span className="reference-attachment__title">Referencia visual</span>
        <span className="reference-attachment__description">
          Abrir imagen
        </span>
      </span>
      <Maximize2
        className="reference-attachment__icon"
        size="var(--icon-size-sm)"
        aria-hidden="true"
      />
    </button>
  );
}
