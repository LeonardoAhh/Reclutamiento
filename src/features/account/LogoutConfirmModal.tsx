import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import "./LogoutConfirmModal.css";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({
  isOpen,
  displayName,
  email,
  avatarUrl,
  isLoading,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="¿Confirmas que quieres cerrar sesión?"
      onClose={isLoading ? () => undefined : onCancel}
      size="xs"
      className="logout-confirm"
      hideCloseButton
      footerActions={
        <>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
        </>
      }
    >
      <div className="modal-body logout-confirm__body">
        <div className="logout-confirm__identity">
          <Avatar name={displayName} src={avatarUrl} />
          <div className="logout-confirm__identity-copy">
            <strong className="logout-confirm__name">{displayName}</strong>
            {email && <span className="logout-confirm__email">{email}</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
