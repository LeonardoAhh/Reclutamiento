import React from "react";
import { Modal } from "./Modal";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

/**
 * Un modal estandarizado para reemplazar window.confirm() nativo.
 * Utiliza el Modal subyacente pero lo preconfigura como un pequeño cuadro de diálogo.
 */
export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      size="xs"
      className="modal-alert"
      hideCloseButton
      fullscreenMobile={false}
      footerActions={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={isDestructive ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="modal-body">
        {description && (
          <div className="text-sm text-charcoal">{description}</div>
        )}
      </div>
    </Modal>
  );
}
