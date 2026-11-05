import { useId, useState } from 'react';
import { CircleCheckBig, PenLine, Save, UserRoundPlus } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Modal } from './Modal';
import { CandidateSheet } from './CandidateSheet';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FormWizard } from './FormWizard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { playSound } from '@/lib/sound';
import './CandidateModal.css';
import { useAuth } from '@/hooks/useAuth';
import { CandidateAccessCard } from '@/components/ui/CandidateAccessCard';
import type { CandidateAccessCardData } from '@/lib/candidateAccessCard';
import { CandidateContactFields, CandidatePositionFields } from './CandidateModalFields';
import { CandidateProcessFields } from './CandidateProcessFields';
import type { CandidateModalMode } from './candidateForm';
import { useCandidateModalForm } from './useCandidateModalForm';
import { useCandidateModalActions } from './useCandidateModalActions';

interface CandidateModalProps {
  isOpen: boolean;
  mode: CandidateModalMode;
  candidate?: Candidate | null;
  candidates?: Candidate[];
  onClose: () => void;
  onSave?: (
    payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
    id?: string,
  ) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (id: string) => Promise<{ ok: boolean; message?: string }> | void;
}

export function CandidateModal({
  isOpen,
  mode,
  candidate,
  candidates = [],
  onClose,
  onSave,
  onDelete,
}: CandidateModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const formId = useId();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  // En edición, `source` y `fecha_cita` pueden ser modificados tanto por
  // admin como por reclutador. El resto de campos sigue bloqueado en
  // edición (estado/proceso se edita desde la fila directamente).
  const canEditCitaAndSource = isAdmin || profile?.role === 'reclutador';
  const [accessCard, setAccessCard] = useState<CandidateAccessCardData | null>(null);
  const isMobile = useIsMobile();
  const {
    areas,
    duplicateSource,
    errors,
    form,
    isFormValid,
    isPhoneValid,
    members,
    noOpenPositions,
    puestosForSection,
    restrictToOpen,
    sectionsForArea,
    setForm,
    setTouched,
    touched,
  } = useCandidateModalForm({ candidate, candidates, isOpen, language, mode });
  const { errorMsg, handleDeleteConfirm, handleSubmit, submitting } = useCandidateModalActions({
    candidate,
    candidates,
    form,
    isFormValid,
    isOpen,
    language,
    members,
    mode,
    onClose,
    onDelete,
    onSave,
    setAccessCard,
    setTouched,
  });

  function closeWithSound() {
    playSound('close');
    onClose();
  }

  const isEdit = mode === 'edit';
  const isDelete = mode === 'delete';

  if (isDelete) {
    return (
      <DeleteConfirmModal
        isOpen={isOpen}
        title={en ? 'Delete candidate' : 'Eliminar candidato'}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={closeWithSound}
        isLoading={submitting}
        errorMessage={errorMsg ?? undefined}
      />
    );
  }

  const icon = accessCard ? (
    <CircleCheckBig size={20} className="color-success" aria-hidden="true" />
  ) : isEdit ? (
    <PenLine size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <UserRoundPlus size={20} className="color-primary" aria-hidden="true" />
  );

  const title = accessCard
    ? en
      ? 'Interview pass'
      : 'Pase de entrevista'
    : isEdit
      ? en
        ? 'Edit candidate'
        : 'Editar candidato'
      : en
        ? 'New candidate'
        : 'Nuevo candidato';

  const fieldProps = {
    canEditCitaAndSource,
    candidateRecruiter: candidate?.reclutador,
    duplicateSource,
    errors,
    form,
    formId,
    isAdmin,
    isEdit,
    isPhoneValid,
    language,
    members,
    noOpenPositions,
    restrictToOpen,
    areas,
    sectionsForArea,
    puestosForSection,
    setForm,
    setTouched,
    touched,
  };
  const fieldsContacto = (
    <div className="candidate-modal__field-row candidate-modal__paired-row">
      <CandidateContactFields {...fieldProps} />
    </div>
  );
  const fieldsPosicion = <CandidatePositionFields {...fieldProps} />;
  const fieldsProceso = <CandidateProcessFields {...fieldProps} />;

  const errorNotice = errorMsg ? (
    <p id="candidate-submit-error" className="form-error-text">
      {errorMsg}
    </p>
  ) : null;

  const useWizard = !accessCard && isMobile;
  const footerActions =
    !accessCard && !useWizard ? (
      <>
        <button type="button" className="btn-secondary" onClick={closeWithSound} disabled={submitting}>
          {en ? 'Cancel' : 'Cancelar'}
        </button>
        <button type="submit" className="btn-primary" form={formId} disabled={submitting}>
          <Save size="var(--icon-size-sm)" aria-hidden="true" />
          {en ? 'Save' : 'Guardar'}
        </button>
      </>
    ) : undefined;

  const Dialog = isMobile ? Modal : CandidateSheet;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={closeWithSound}
      className={
        accessCard ? 'candidate-access-card-modal' : `candidate-modal${useWizard ? ' modal-wizard-mobile' : ''}`
      }
      size="sm"
      icon={accessCard ? undefined : icon}
      title={title}
      footerActions={footerActions}
    >
      {accessCard ? (
        <CandidateAccessCard data={accessCard} />
      ) : useWizard ? (
        /* ── Móvil: registro por pasos ── */
        <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
          <FormWizard
            onCancel={closeWithSound}
            onBeforeStepChange={() => {
              playSound('navigate');
              return true;
            }}
            submitting={submitting}
            submitDisabled={!isFormValid}
            submitLabel={en ? 'Save' : 'Guardar'}
            submittingLabel={en ? 'Saving…' : 'Guardando…'}
            notice={errorMsg ? errorNotice : null}
            steps={[
              {
                id: 'contacto',
                title: en ? 'Contact' : 'Contacto',
                isValid: !errors.nombre && !errors.telefono && !errors.email,
                content: <div className="form-grid">{fieldsContacto}</div>,
              },
              {
                id: 'posicion',
                title: en ? 'Position' : 'Posición',
                isValid: !errors.area && !errors.seccion && !errors.puesto,
                content: <div className="form-grid">{fieldsPosicion}</div>,
              },
              {
                id: 'proceso',
                title: en ? 'Process' : 'Proceso',
                isValid: !errors.reclutador && !errors.source && !errors.fecha_aplicacion && !errors.fecha_cita,
                content: <div className="form-grid">{fieldsProceso}</div>,
              },
            ]}
          />
        </form>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="modal-body" noValidate>
          <div className="form-grid">
            {fieldsContacto}
            {fieldsPosicion}
            {fieldsProceso}
          </div>

          {errorNotice}
        </form>
      )}
    </Dialog>
  );
}
