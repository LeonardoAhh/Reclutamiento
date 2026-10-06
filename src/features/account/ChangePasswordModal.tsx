import { Modal } from '@/components/ui/Modal';
import { useRef } from 'react';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const formRef = useRef<{ close: () => void }>(null);
  const { language } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => formRef.current?.close()}
      title={language === 'en' ? 'Change password' : 'Cambiar contraseña'}
      closeLabel={language === 'en' ? 'Close' : 'Cerrar'}
      size="xs"
      className="change-password-modal"
    >
      <div className="modal-body">
        <PasswordChangeForm ref={formRef} onCancel={onClose} />
      </div>
    </Modal>
  );
}
