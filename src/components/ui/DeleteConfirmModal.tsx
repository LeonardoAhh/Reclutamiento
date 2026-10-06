import { ConfirmModal } from "./ConfirmModal";
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  errorMessage?: string;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isLoading = false,
  errorMessage,
}: DeleteConfirmModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  return (
    <ConfirmModal
      isOpen={isOpen}
      title={title}
      description={en ? 'This action cannot be undone.' : 'Esta acción no se puede deshacer.'}
      confirmLabel={en ? 'Delete' : 'Eliminar'}
      cancelLabel={en ? 'Cancel' : 'Cancelar'}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isDestructive
      isLoading={isLoading}
      loadingLabel={en ? 'Deleting…' : 'Eliminando…'}
      errorMessage={errorMessage}
    />
  );
}
