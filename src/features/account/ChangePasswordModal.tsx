import { Modal } from '@/components/ui/Modal';
import { useRef } from 'react';
import { PasswordChangeForm } from './PasswordChangeForm';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const formRef = useRef<{ close: () => void }>(null);
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => formRef.current?.close()}
      title="Cambiar contraseña"
      size="xs"
      className="change-password-modal"
    >
      <div className="modal-body">
        <PasswordChangeForm ref={formRef} onCancel={onClose} />
      </div>
    </Modal>
  );
}
