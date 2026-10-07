import { useEffect, useState } from "react";
import { ModalPresentationProvider } from "@/components/ui/ModalPresentation";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LightboxModal } from "@/components/ui/LightboxModal";
import { getDataUpdatePhotoUrl } from "./api";
import { useDataUpdateText } from "./translations";
import "./DataUpdatePhotoModal.css";

interface DataUpdatePhotoModalProps {
  name: string;
  path: string;
  onClose: () => void;
}

export function DataUpdatePhotoModal({ name, path, onClose }: DataUpdatePhotoModalProps) {
  const isMobile = useIsMobile();
  const t = useDataUpdateText();
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
    <ModalPresentationProvider value={isMobile ? "modal" : "sheet"}>
      <LightboxModal
        isOpen
        onClose={onClose}
        src={url}
        size="sm"
        className="data-update-photo-modal"
        loadingFallback={
          <LoadingSkeleton label={t("Cargando fotografía…")} className="data-update-photo-modal__skeleton">
            <span className="loading-skeleton__bone data-update-photo-modal__bone" aria-hidden="true" />
          </LoadingSkeleton>
        }
        title={t("Fotografía")}
        alt={t(`Fotografía de ${name}`)}
        loading={!error && !url}
        onImageError={() => {
          setUrl(null);
          setError(true);
        }}
      >
        {error ? (
          <div className="data-update-photo-modal__error">
            <p role="alert">{t("No se pudo cargar la fotografía.")}</p>
            <button type="button" className="btn-secondary" onClick={() => setAttempt((value) => value + 1)}>
              {t("Reintentar")}
            </button>
          </div>
        ) : null}
      </LightboxModal>
    </ModalPresentationProvider>
  );
}
