import { useId, useRef, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { changePassword } from '@/lib/auth';
import './ChangePasswordModal.css';

type Field = 'current' | 'new' | 'confirm' | 'form';
type FormError = { field: Field; message: string } | null;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const formId = useId();
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();
  const currentErrorId = useId();
  const newErrorId = useId();
  const confirmErrorId = useId();
  const newHintId = useId();
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<FormError>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    if (submitting) return;
    if (
      (currentPassword || newPassword || confirmation) &&
      !window.confirm('¿Descartar las contraseñas ingresadas?')
    ) return;
    resetForm();
    onClose();
  }

  function showError(field: Field, message: string) {
    setError({ field, message });
    requestAnimationFrame(() => {
      if (field === 'current') currentRef.current?.focus();
      if (field === 'new') newRef.current?.focus();
      if (field === 'confirm') confirmRef.current?.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      showError('current', 'Ingresa tu contraseña actual.');
      return;
    }
    if (newPassword.length < 8) {
      showError('new', 'La contraseña nueva debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword === currentPassword) {
      showError('new', 'Elige una contraseña distinta de la actual.');
      return;
    }
    if (confirmation !== newPassword) {
      showError('confirm', 'La confirmación debe coincidir con la contraseña nueva.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setSubmitting(false);

    if (!result.ok) {
      showError(result.field, result.message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setSuccess(true);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar contraseña"
      size="xs"
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </>
      }
    >
      <form id={formId} className="modal-body" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor={currentId}>Contraseña actual</label>
          <input
            ref={currentRef}
            id={currentId}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setSuccess(false);
              if (error?.field === 'current' || error?.field === 'form') setError(null);
            }}
            aria-invalid={error?.field === 'current' || undefined}
            aria-describedby={error?.field === 'current' ? currentErrorId : undefined}
            disabled={submitting}
            aria-required="true"
          />
          {error?.field === 'current' && <span id={currentErrorId} className="form-error">{error.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor={newId}>Contraseña nueva</label>
          <input
            ref={newRef}
            id={newId}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setSuccess(false);
              if (error?.field === 'new' || error?.field === 'form') setError(null);
            }}
            aria-invalid={error?.field === 'new' || undefined}
            aria-describedby={error?.field === 'new' ? `${newHintId} ${newErrorId}` : newHintId}
            disabled={submitting}
            aria-required="true"
          />
          <span id={newHintId} className="change-password__hint">Mínimo 8 caracteres.</span>
          {error?.field === 'new' && <span id={newErrorId} className="form-error">{error.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor={confirmId}>Confirmar contraseña nueva</label>
          <input
            ref={confirmRef}
            id={confirmId}
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
              setSuccess(false);
              if (error?.field === 'confirm' || error?.field === 'form') setError(null);
            }}
            aria-invalid={error?.field === 'confirm' || undefined}
            aria-describedby={error?.field === 'confirm' ? confirmErrorId : undefined}
            disabled={submitting}
            aria-required="true"
          />
          {error?.field === 'confirm' && <span id={confirmErrorId} className="form-error">{error.message}</span>}
        </div>

        {error?.field === 'form' && <span className="form-error" role="alert">{error.message}</span>}
        {success && <span className="form-success-text" role="status">Tu contraseña se cambió correctamente.</span>}
      </form>
    </Modal>
  );
}
