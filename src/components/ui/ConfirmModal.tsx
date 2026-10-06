import React from "react";
import { useLanguage } from '@/contexts/LanguageContext';
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
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string;
}

/**
 * Un modal estandarizado para reemplazar window.confirm() nativo.
 * Utiliza el Modal subyacente pero lo preconfigura como un pequeño cuadro de diálogo.
 */
export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = true,
  isLoading = false,
  loadingLabel,
  errorMessage,
}: ConfirmModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      size="xs"
      className="modal-alert"
      hideCloseButton
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel ?? (en ? 'Cancel' : 'Cancelar')}
          </button>
          <button
            type="button"
            className={isDestructive ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (loadingLabel ?? (en ? 'Processing…' : 'Procesando…')) : (confirmLabel ?? (en ? 'Confirm' : 'Aceptar'))}
          </button>
        </>
      }
    >
      <div className="modal-body">
        {description && (
          <div className="text-sm text-charcoal">{description}</div>
        )}
        {errorMessage && (
          <p className="form-error-text" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </Modal>
  );
}
