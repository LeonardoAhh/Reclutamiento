import { useEffect, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
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
  loadingFallback?: ReactNode;
  className?: string;
  onImageError?: () => void;
}

export function LightboxModal({
  isOpen,
  onClose,
  src,
  size = "lg",
  title,
  alt,
  children,
  loading = false,
  loadingFallback,
  className,
  onImageError,
}: LightboxModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
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
      title={title ?? (en ? 'Visual reference' : 'Referencia visual')}
      size={size}
      className={className}
    >
      <div className="modal-body lightbox-modal__body">
        {(src && !imageFailed) || loading ? (
          <div className="lightbox-modal__visual" aria-busy={showLoading}>
            {loadingFallback ? (showLoading && loadingFallback) : (
              <span className="lightbox-modal__indicator" data-loaded={imageReady} aria-hidden="true">
                <MorphingIcon
                  icon={imageReady ? ImageIcon : LoaderCircle}
                  size="var(--icon-size-xl)"
                  className={showLoading ? "lightbox-modal__spinner" : undefined}
                />
              </span>
            )}
            {showLoading && !loadingFallback && <span className="sr-only" role="status">{en ? 'Loading image…' : 'Cargando imagen…'}</span>}
            {src && !imageFailed && (
              <img
                src={src}
                alt={alt ?? (en ? 'Enlarged visual reference' : 'Referencia visual ampliada')}
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
          <p className="lightbox-modal__message" role="alert">{en ? 'Could not display the image.' : 'No se pudo mostrar la imagen.'}</p>
        ))}
      </div>
    </Modal>
  );
}
