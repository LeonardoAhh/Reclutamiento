import { useEffect, useId, useState } from 'react';
import { CircleAlert, HeartPulse } from 'lucide-react';
import { Modal } from './Modal';
import { Checkbox } from './Checkbox';
import type { Employee } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import './IncapacidadModal.css';

interface IncapacidadModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (
    num_empleado: string,
    en_incapacidad: boolean,
    incapacidad_hasta: string | null
  ) => Promise<{ ok: boolean; message?: string }>;
}

export function IncapacidadModal({
  isOpen,
  employee,
  onClose,
  onSave,
}: IncapacidadModalProps) {
  const [enIncapacidad, setEnIncapacidad] = useState(false);
  const [hasta, setHasta] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const formId = useId();

  useEffect(() => {
    if (!isOpen || !employee) return;
    setEnIncapacidad(Boolean(employee.en_incapacidad));
    setHasta(employee.incapacidad_hasta ?? '');
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, employee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !employee) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const result = await onSave(
        employee.num_empleado,
        enIncapacidad,
        enIncapacidad && hasta ? hasta : null
      );
      if (result.ok === false) {
        setErrorMsg(result.message ?? 'No se pudo guardar.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!employee) return null;

  const footerActions = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={submitting}
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="btn-primary"
        form={formId}
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? 'Guardando…' : 'Guardar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="incapacidad-modal"
      icon={
        <HeartPulse
          className="incapacidad-modal__icon"
          aria-hidden="true"
        />
      }
      title="Marcar incapacidad"
      size="xs"
      footerActions={footerActions}
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="modal-body"
        noValidate
      >
        <label htmlFor={`${formId}-toggle`} className="incapacidad-modal__toggle">
          <Checkbox
            id={`${formId}-toggle`}
            checked={enIncapacidad}
            onChange={(e) => setEnIncapacidad(e.target.checked)}
            disabled={submitting}
          />
          <span className="incapacidad-modal__toggle-label">
            En incapacidad médica
          </span>
        </label>

        <div className="form-group">
          <label htmlFor="incapacidad-hasta">
            Fecha estimada de regreso
          </label>
          <input
            id="incapacidad-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            disabled={!enIncapacidad}
            min={localTodayIso()}
          />
        </div>

        {errorMsg && (
          <div className="form-error-text incapacidad-modal__error" role="alert">
            <CircleAlert aria-hidden="true" />
            {errorMsg}
          </div>
        )}
      </form>
    </Modal>
  );
}
