import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide";
import { AttachmentCard } from "@/components/ui/AttachmentCard";
import { LightboxModal } from "@/components/ui/LightboxModal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import {
  TRANSPORT_INCIDENT_IMAGE_ACCEPT,
  formatTransportIncidentImageMetadata,
  validateTransportIncidentImage,
} from "@/lib/transport-incident-image";
import "./IncidentImageField.css";

interface IncidentImageFieldProps {
  file: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

export function IncidentImageField({
  file,
  disabled = false,
  onChange,
}: IncidentImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateTransportIncidentImage(selectedFile);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError(null);
    onChange(selectedFile);
  };

  const handleRemove = () => {
    setError(null);
    setPreviewOpen(false);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="form-group incident-image-field">
      <label className="reporte-publico__label" htmlFor="incident-image">
        Imagen de evidencia <span className="incident-image-field__optional">(opcional)</span>
      </label>
      <p className="incident-image-field__help" id="incident-image-help">
        JPEG, PNG o WebP. Máximo 5 MB.
      </p>

      {file && previewUrl ? (
        <AttachmentCard
          name={file.name}
          metadata={formatTransportIncidentImageMetadata(file)}
          imageSrc={previewUrl}
          onPreview={() => setPreviewOpen(true)}
          previewLabel={`Ampliar vista previa de ${file.name}`}
          onRemove={disabled ? undefined : handleRemove}
          removeLabel={`Quitar ${file.name}`}
          removeIcon={
            <MorphingIcon icon={X} size="var(--icon-size-sm)" />
          }
        />
      ) : (
        <label
          className={`incident-image-field__picker${error ? " is-error" : ""}`}
          htmlFor="incident-image"
        >
          <MorphingIcon icon={ImageUp} size="var(--icon-size-md)" />
          <span>Adjuntar imagen</span>
          <input
            ref={inputRef}
            id="incident-image"
            type="file"
            accept={TRANSPORT_INCIDENT_IMAGE_ACCEPT}
            className="sr-only"
            aria-describedby={`incident-image-help${error ? " incident-image-error" : ""}`}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            onChange={handleFileChange}
          />
        </label>
      )}

      {error && (
        <p className="incident-image-field__error" id="incident-image-error" role="alert">
          {error}
        </p>
      )}

      <LightboxModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewUrl}
        title="Vista previa"
        alt={`Vista previa de ${file?.name ?? "imagen adjunta"}`}
      />
    </div>
  );
}
