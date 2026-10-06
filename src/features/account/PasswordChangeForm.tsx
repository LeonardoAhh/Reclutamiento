import { useId, useImperativeHandle, useRef, useState, type FormEvent, type Ref } from 'react';
import { changePassword } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import './ChangePasswordModal.css';

type Field = 'current' | 'new' | 'confirm' | 'form';
type FormError = { field: Field; message: string } | null;

interface PasswordChangeFormProps {
  ref?: Ref<{ close: () => void }>;
  onCancel: () => void;
  onChanged?: () => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function PasswordChangeForm({
  ref, onCancel, onChanged, submitLabel = 'Cambiar contraseña', cancelLabel = 'Cancelar',
}: PasswordChangeFormProps) {
  const { language } = useLanguage();
  const english = language === 'en';
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
      !window.confirm(english ? 'Discard the entered passwords?' : '¿Descartar las contraseñas ingresadas?')
    ) return;
    resetForm();
    onCancel();
  }

  function showError(field: Field, message: string) {
    setError({ field, message });
    requestAnimationFrame(() => {
      if (field === 'current') currentRef.current?.focus();
      if (field === 'new') newRef.current?.focus();
      if (field === 'confirm') confirmRef.current?.focus();
    });
  }

  useImperativeHandle(ref, () => ({ close: handleClose }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      showError('current', english ? 'Enter your current password.' : 'Ingresa tu contraseña actual.');
      return;
    }
    if (newPassword.length < 8) {
      showError('new', english ? 'The new password must be at least 8 characters.' : 'La contraseña nueva debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword === currentPassword) {
      showError('new', english ? 'Choose a password different from the current one.' : 'Elige una contraseña distinta de la actual.');
      return;
    }
    if (confirmation !== newPassword) {
      showError('confirm', english ? 'Confirmation must match the new password.' : 'La confirmación debe coincidir con la contraseña nueva.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);

    if (!result.ok) {
      setSubmitting(false);
      const englishMessages: Record<string, string> = {
        'El servicio de cambio de contraseña no está disponible. Intenta más tarde.': 'The password service is unavailable. Try again later.',
        'El servicio rechazó la sesión. Vuelve a iniciar sesión; si persiste, contacta al administrador.': 'The service rejected the session. Sign in again; if the issue continues, contact your administrator.',
        'El servicio de cambio de contraseña no está publicado. Contacta al administrador.': 'The password service is not deployed. Contact your administrator.',
        'Se hicieron demasiados intentos. Espera unos minutos antes de volver a intentar.': 'Too many attempts. Wait a few minutes before trying again.',
        'No se pudo conectar con el servicio. Revisa tu conexión e intenta de nuevo.': 'Could not connect to the service. Check your connection and try again.',
        'No se pudo cambiar la contraseña. Intenta de nuevo.': 'Could not change the password. Try again.',
        'No se pudo conectar para cambiar la contraseña. Revisa tu conexión e intenta de nuevo.': 'Could not connect to change the password. Check your connection and try again.',
      };
      showError(result.field, english ? englishMessages[result.message] ?? result.message : result.message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setSuccess(true);
    await onChanged?.();
    setSubmitting(false);
  }

  return (
    <form className="password-change-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor={currentId}>{english ? 'Current password' : 'Contraseña actual'}</label>
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
        <label htmlFor={newId}>{english ? 'New password' : 'Contraseña nueva'}</label>
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
        <span id={newHintId} className="change-password__hint">{english ? 'At least 8 characters.' : 'Mínimo 8 caracteres.'}</span>
        {error?.field === 'new' && <span id={newErrorId} className="form-error">{error.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor={confirmId}>{english ? 'Confirm new password' : 'Confirmar contraseña nueva'}</label>
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
      {success && <span className="form-success-text" role="status">{english ? 'Your password was changed.' : 'Tu contraseña se cambió correctamente.'}</span>}
      <div className="password-change-form__actions">
        <button type="button" className="btn-secondary" onClick={handleClose} disabled={submitting}>
          {english && cancelLabel === 'Cancelar' ? 'Cancel' : cancelLabel}
        </button>
        <button type="submit" className="btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? (english ? 'Saving…' : 'Guardando…') : english && submitLabel === 'Cambiar contraseña' ? 'Change password' : submitLabel}
        </button>
      </div>
    </form>
  );
}
