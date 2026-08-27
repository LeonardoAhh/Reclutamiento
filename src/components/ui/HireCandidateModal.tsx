import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheckBig, UserRoundPlus } from 'lucide-react';
import { LoaderCircle, UserRoundPlus as UserPlusIcon } from 'lucide';
import { Modal } from './Modal';
import { MorphingIcon } from './MorphingIcon';
import type { Candidate, Employee } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import { CustomSelect } from './CustomSelect';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import './HireCandidateModal.css';

interface HireCandidateModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onConfirm: (input: {
    mode: 'create' | 'associate';
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

  const { employees } = useSupabaseData();
  const [mode, setMode] = useState<'create' | 'associate'>('create');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyForm());
    setErrorMsg(null);
    setSubmitting(false);
    setMode('create');
    setSelectedEmployeeId('');
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

    let targetEmployee: Employee;

    if (mode === 'create') {
      const num = form.num_empleado.trim();
      if (!num) {
        setErrorMsg('El número de empleado es obligatorio.');
        return;
      }
      targetEmployee = {
        num_empleado: num,
        nombre: candidate.nombre,
        area: candidate.area,
        seccion: candidate.seccion ?? '',
        puesto: candidate.puesto,
        categoria: form.categoria.trim() || 'N/A',
        turno: form.turno.trim() || '1',
        fecha_ingreso: form.fecha_ingreso || todayIso(),
      };
    } else {
      if (!selectedEmployeeId) {
        setErrorMsg('Debes seleccionar un empleado existente.');
        return;
      }
      const existing = employees.find((e) => e.num_empleado === selectedEmployeeId);
      if (!existing) {
        setErrorMsg('No se encontró el empleado seleccionado.');
        return;
      }
      targetEmployee = existing;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const result = await onConfirm({
        mode,
        employee: targetEmployee,
        candidateId: candidate.id,
      });
      if (!result.ok) {
        setErrorMsg(result.message ?? (mode === 'create' ? 'No se pudo contratar al candidato.' : 'No se pudo asociar al candidato.'));
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
      icon={<UserRoundPlus size={20} className="color-primary" aria-hidden="true" />}
      title={`Contratar a ${candidate.nombre}`}
      subtitle={`${candidate.puesto} · ${candidate.area}${candidate.seccion ? ` · ${candidate.seccion}` : ''}`}
    >
      {alreadyHired ? (
        <div className="modal-body">
          <div className="delete-warning">
            <div
              className="delete-warning__icon hire-success-icon"
              aria-hidden="true"
            >
              <CircleCheckBig size={32} />
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
        <form onSubmit={handleSubmit} className="modal-body" noValidate aria-describedby="hire-hint-text">
          <div className="hire-mode-tabs">
            <button
              type="button"
              className={mode === 'create' ? 'hire-mode-active' : ''}
              onClick={() => { setMode('create'); setErrorMsg(null); }}
            >
              Crear nuevo
            </button>
            <button
              type="button"
              className={mode === 'associate' ? 'hire-mode-active' : ''}
              onClick={() => { setMode('associate'); setErrorMsg(null); }}
            >
              Vincular existente
            </button>
          </div>

          {mode === 'create' ? (
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
                  required={mode === 'create'}
                  aria-required={mode === 'create' ? 'true' : 'false'}
                  aria-invalid={!!errorMsg}
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
                <CustomSelect
                  id="hire-turno"
                  value={form.turno}
                  onChange={(val) => update('turno', val)}
                  options={[
                    { value: '0', label: 'Administrativo (0)' },
                    { value: '1', label: '1er Turno' },
                    { value: '2', label: '2do Turno' },
                    { value: '3', label: '3er Turno' },
                    { value: '4', label: '4to Turno' },
                    { value: '5', label: '5to Turno' },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="hire-associate-select">Selecciona el empleado *</label>
              <CustomSelect
                id="hire-associate-select"
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                options={employees.map(e => ({ value: e.num_empleado, label: `${e.nombre} (#${e.num_empleado})` }))}
                searchable={true}
                placeholder="Buscar por nombre o número..."
              />
            </div>
          )}

          <p id="hire-hint-text" className="hire-hint">
            {mode === 'create'
              ? <>Se creará un nuevo empleado y el candidato pasará a estado <strong>Contratado</strong>.</>
              : <>Se enlazará con el empleado seleccionado y pasará a estado <strong>Contratado</strong>.</>
            }
          </p>

          {errorMsg && (
            <p className="form-error" role="alert">
              <CircleAlert size={14} aria-hidden="true" /> {errorMsg}
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
              disabled={submitting || (mode === 'create' ? !form.num_empleado.trim() : !selectedEmployeeId)}
              aria-busy={submitting}
            >
              <MorphingIcon
                icon={submitting ? LoaderCircle : UserPlusIcon}
                size={16}
                aria-hidden="true"
                className={
                  submitting ? 'spin' : undefined
                }
              />
              {submitting ? 'Guardando…' : (mode === 'create' ? 'Contratar' : 'Vincular')}
            </button>
          </footer>
        </form>
      )}
    </Modal>
  );
}
