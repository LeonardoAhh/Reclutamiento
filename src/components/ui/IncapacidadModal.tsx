import { useEffect, useState } from 'react';
import { HeartPulse, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import type { Employee } from '@/lib/types';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="incapacidad-modal"
      icon={
        <HeartPulse
          size={20}
          className="incapacidad-modal__icon"
          aria-hidden="true"
        />
      }
      title="Marcar incapacidad"
      subtitle={`${employee.nombre} · #${employee.num_empleado}`}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        <div className="incapacidad-modal__meta">
          <span>
            <strong>{employee.puesto}</strong>
          </span>
          <span className="incapacidad-modal__meta-sub">
            {employee.area} · {employee.seccion}
          </span>
        </div>

        <label className="incapacidad-modal__toggle">
          <input
            type="checkbox"
            checked={enIncapacidad}
            onChange={(e) => setEnIncapacidad(e.target.checked)}
          />
          <span className="incapacidad-modal__toggle-label">
            En incapacidad médica
          </span>
        </label>

        <div className="form-group">
          <label htmlFor="incapacidad-hasta">
            Fecha estimada de regreso{' '}
            <span className="incapacidad-modal__optional">(opcional)</span>
          </label>
          <input
            id="incapacidad-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            disabled={!enIncapacidad}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        {errorMsg && (
          <div className="incapacidad-modal__error" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errorMsg}
          </div>
        )}

        <div className="modal-footer">
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
            disabled={submitting}
          >
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
