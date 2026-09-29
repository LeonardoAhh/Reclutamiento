import { useEffect, useState } from "react";
import { LightboxModal } from "@/components/ui/LightboxModal";
import { getDataUpdatePhotoUrl } from "./api";
import "./DataUpdatePhotoModal.css";

interface DataUpdatePhotoModalProps {
  name: string;
  path: string;
  onClose: () => void;
}

export function DataUpdatePhotoModal({ name, path, onClose }: DataUpdatePhotoModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setError(false);

    void getDataUpdatePhotoUrl(path)
      .then((signedUrl) => {
        if (active) setUrl(signedUrl);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => { active = false; };
  }, [path, attempt]);

  return (
    <LightboxModal
      isOpen
      onClose={onClose}
      src={url}
      size="sm"
      title="Fotografía"
      alt={`Fotografía de ${name}`}
      loading={!error && !url}
      onImageError={() => {
        setUrl(null);
        setError(true);
      }}
    >
      {error ? (
        <div className="data-update-photo-modal__error">
          <p role="alert">No se pudo cargar la fotografía.</p>
          <button type="button" className="btn-secondary" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </button>
        </div>
      ) : null}
    </LightboxModal>
  );
}
