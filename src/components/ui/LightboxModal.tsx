import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Image as ImageIcon, LoaderCircle } from "lucide";
import { Modal } from "./Modal";
import { MorphingIcon } from "./MorphingIcon";
import "./LightboxModal.css";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string | null;
  size?: "sm" | "md" | "lg";
  title?: string;
  alt?: string;
  children?: ReactNode;
  loading?: boolean;
  onImageError?: () => void;
}

export function LightboxModal({
  isOpen,
  onClose,
  src,
  size = "lg",
  title = "Referencia visual",
  alt = "Referencia visual ampliada",
  children,
  loading = false,
  onImageError,
}: LightboxModalProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFailedSrc(null);
      setLoadedSrc(null);
    }
  }, [isOpen]);

  const imageFailed = Boolean(src && !onImageError && failedSrc === src);
  const imageReady = Boolean(src && loadedSrc === src);
  const showLoading = !imageFailed && (loading || Boolean(src && !imageReady));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      <div className="modal-body lightbox-modal__body">
        {(src && !imageFailed) || loading ? (
          <div className="lightbox-modal__visual" aria-busy={showLoading}>
            <span className="lightbox-modal__indicator" data-loaded={imageReady} aria-hidden="true">
              <MorphingIcon
                icon={imageReady ? ImageIcon : LoaderCircle}
                size="var(--icon-size-xl)"
                className={showLoading ? "lightbox-modal__spinner" : undefined}
              />
            </span>
            {showLoading && <span className="sr-only" role="status">Cargando imagen…</span>}
            {src && !imageFailed && (
              <img
                src={src}
                alt={alt}
                className="lightbox-modal__image"
                data-loaded={imageReady}
                onLoad={() => setLoadedSrc(src)}
                onError={() => {
                  if (onImageError) onImageError();
                  else setFailedSrc(src);
                }}
              />
            )}
          </div>
        ) : children ?? (imageFailed && (
          <p className="lightbox-modal__message" role="alert">No se pudo mostrar la imagen.</p>
        ))}
      </div>
    </Modal>
  );
}
