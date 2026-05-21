import { useEffect, useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import type { Candidate, Employee } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import './EmployeeSheet.css';

interface HireCandidateModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onConfirm: (input: {
    employee: Employee;
    candidateId: string;
  }) => Promise<{ ok: boolean; message?: string }>;
}

type FormState = Pick<
  Employee,
  'num_empleado' | 'categoria' | 'turno' | 'fecha_ingreso'
>;

function todayIso(): string {
  return localTodayIso();
}

function emptyForm(): FormState {
  return {
    num_empleado: '',
    categoria: 'N/A',
    turno: '1',
    fecha_ingreso: todayIso(),
  };
}

export function HireCandidateModal({
  isOpen,
  candidate,
  onClose,
  onConfirm,
}: HireCandidateModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyForm());
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, candidate?.id]);

  if (!candidate) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const alreadyHired = !!candidate.employee_num;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate?.id) {
      setErrorMsg('El candidato debe estar guardado antes de contratarlo.');
      return;
    }
    const num = form.num_empleado.trim();
    if (!num) {
      setErrorMsg('El número de empleado es obligatorio.');
      return;
    }

    const emp: Employee = {
      num_empleado: num,
      nombre: candidate.nombre,
      area: candidate.area,
      seccion: candidate.seccion ?? '',
      puesto: candidate.puesto,
      categoria: form.categoria.trim() || 'N/A',
      turno: form.turno.trim() || '1',
      fecha_ingreso: form.fecha_ingreso || todayIso(),
    };

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const result = await onConfirm({ employee: emp, candidateId: candidate.id });
      if (!result.ok) {
        setErrorMsg(result.message ?? 'No se pudo contratar al candidato.');
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
      className="employee-modal"
      icon={<UserPlus size={20} className="color-primary" aria-hidden="true" />}
      title={`Contratar a ${candidate.nombre}`}
      subtitle={`${candidate.puesto} · ${candidate.area}${candidate.seccion ? ` · ${candidate.seccion}` : ''}`}
    >
      {alreadyHired ? (
        <div className="modal-body">
          <div className="delete-warning">
            <div
              className="delete-warning__icon"
              style={{
                background: 'var(--color-success-tint, var(--color-surface-soft))',
                color: 'var(--color-accent-teal, var(--color-success))',
              }}
              aria-hidden="true"
            >
              <CheckCircle2 size={32} />
            </div>
            <p className="delete-warning__title">
              Ya está contratado como empleado{' '}
              <span className="delete-warning__name">#{candidate.employee_num}</span>
            </p>
            <p className="delete-warning__sub">
              Si necesitas corregir los datos del empleado, edítalo directamente
              en el Dashboard.
            </p>
          </div>
          <footer className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </footer>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="hire-num">Número de empleado *</label>
              <input
                id="hire-num"
                type="text"
                inputMode="numeric"
                value={form.num_empleado}
                onChange={(e) => update('num_empleado', e.target.value.trim())}
                placeholder="Ej. 12345"
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="hire-fecha">Fecha de ingreso</label>
              <input
                id="hire-fecha"
                type="date"
                value={form.fecha_ingreso}
                onChange={(e) => update('fecha_ingreso', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="hire-categoria">Categoría</label>
              <input
                id="hire-categoria"
                type="text"
                value={form.categoria}
                onChange={(e) => update('categoria', e.target.value)}
                placeholder="N/A"
              />
            </div>
            <div className="form-group">
              <label htmlFor="hire-turno">Turno</label>
              <select
                id="hire-turno"
                value={form.turno}
                onChange={(e) => update('turno', e.target.value)}
              >
                <option value="0">Administrativo (0)</option>
                <option value="1">1er Turno</option>
                <option value="2">2do Turno</option>
                <option value="3">3er Turno</option>
                <option value="4">4to Turno</option>
                <option value="5">5to Turno</option>
              </select>
            </div>
          </div>

          <p className="hire-hint">
            Al confirmar se crea un registro nuevo en <code>empleados</code> con
            los datos del candidato. El candidato queda marcado como{' '}
            <strong>Contratado</strong> y enlazado al empleado generado.
          </p>

          {errorMsg && (
            <p className="form-error" role="alert">
              <AlertCircle size={14} aria-hidden="true" /> {errorMsg}
            </p>
          )}

          <footer className="modal-footer">
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
              disabled={submitting || !form.num_empleado.trim()}
            >
              <UserPlus size={16} aria-hidden="true" />
              {submitting ? 'Contratando…' : 'Contratar'}
            </button>
          </footer>
        </form>
      )}
    </Modal>
  );
}
