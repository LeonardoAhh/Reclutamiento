import { ConfirmModal } from "./ConfirmModal";
import { ModalPresentationProvider } from "./ModalPresentation";
import { useIsMobile } from "@/hooks/useIsMobile";
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
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const en = language === 'en';
  return (
    <ModalPresentationProvider value="modal">
      <ConfirmModal
        isOpen={isOpen}
        title={title}
        description={en ? 'This action cannot be undone.' : 'Esta acción no se puede deshacer.'}
        confirmLabel={en ? 'Delete' : 'Eliminar'}
        cancelLabel={en ? 'Cancel' : 'Cancelar'}
        onConfirm={onConfirm}
        onCancel={onCancel}
        placement={isMobile ? undefined : "center"}
        hideCloseButton={false}
        isDestructive
        isLoading={isLoading}
        loadingLabel={en ? 'Deleting…' : 'Eliminando…'}
        errorMessage={errorMessage}
      />
    </ModalPresentationProvider>
  );
}
