import { Modal } from "./Modal";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string | null;
}

export function LightboxModal({ isOpen, onClose, src }: LightboxModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Referencia visual"
      size="sm"
      fullscreenMobile={false}
      className="activity-lightbox"
    >
      <div className="modal-body activity-lightbox__body">
        {src && (
          <img
            src={src}
            alt="Referencia visual ampliada"
            className="activity-lightbox__image"
          />
        )}
      </div>
    </Modal>
  );
}
