import { useEffect, useState } from 'react';
import { Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import type { Employee } from '@/lib/types';
import './DeleteEmployeeConfirmModal.css';

interface DeleteEmployeeConfirmModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onConfirm: (
    num_empleado: string
  ) => Promise<{ ok: boolean; message?: string }>;
}

/**
 * Confirmación destructiva con verificación por texto: el usuario debe
 * teclear el número de empleado exacto para habilitar el borrado. Evita
 * eliminaciones accidentales. No genera registro de baja — borra el empleado.
 */
export function DeleteEmployeeConfirmModal({
  isOpen,
  employee,
  onClose,
  onConfirm,
}: DeleteEmployeeConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTyped('');
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, employee]);

  if (!employee) return null;

  const matches = typed.trim() === employee.num_empleado;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !matches || !employee) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const result = await onConfirm(employee.num_empleado);
      if (result.ok === false) {
        setErrorMsg(result.message ?? 'No se pudo eliminar.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="delete-employee-modal"
      fullscreenMobile={false}
      icon={
        <Trash2
          size={20}
          className="delete-employee-modal__icon"
          aria-hidden="true"
        />
      }
      title="Eliminar empleado"
      subtitle={`${employee.nombre} · #${employee.num_empleado}`}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        <div className="delete-employee-modal__warning" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <p>
            Esta acción elimina al empleado de forma permanente y no se puede
            deshacer.
          </p>
        </div>

        <div className="delete-employee-modal__meta">
          <span>
            <strong>{employee.puesto}</strong>
          </span>
          <span className="delete-employee-modal__meta-sub">
            {employee.area} · {employee.seccion}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="delete-confirm-input">
            Escribe el número de empleado{' '}
            <strong className="delete-employee-modal__token">
              {employee.num_empleado}
            </strong>{' '}
            para confirmar
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={employee.num_empleado}
            autoComplete="off"
            inputMode="text"
          />
        </div>

        {errorMsg && (
          <div className="delete-employee-modal__error" role="alert">
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
            className="btn-danger"
            disabled={submitting || !matches}
          >
            {submitting ? 'Eliminando…' : 'Eliminar empleado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
