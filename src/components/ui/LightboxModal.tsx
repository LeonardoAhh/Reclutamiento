import { Modal } from "./Modal";
import "./LightboxModal.css";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string | null;
  title?: string;
  alt?: string;
}

export function LightboxModal({
  isOpen,
  onClose,
  src,
  title = "Referencia visual",
  alt = "Referencia visual ampliada",
}: LightboxModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      fullscreenMobile={false}
      className="activity-lightbox"
    >
      <div className="modal-body activity-lightbox__body">
        {src && (
          <img
            src={src}
            alt={alt}
            className="activity-lightbox__image"
          />
        )}
      </div>
    </Modal>
  );
}
