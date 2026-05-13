import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import { localTodayIso } from '@/lib/dates';
import { Modal } from './Modal';
import './EmployeeModal.css';

interface EmployeeModalProps {
  isOpen: boolean;
  mode: 'add' | 'delete';
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (num_empleado: string) => Promise<{ ok: boolean; message?: string }> | void;
}

type FormState = Pick<
  Employee,
  'num_empleado' | 'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso'
>;

function emptyForm(): FormState {
  return {
    num_empleado: '',
    nombre: '',
    area: '',
    seccion: '',
    puesto: '',
    categoria: 'N/A',
    turno: '1',
    fecha_ingreso: localTodayIso(),
  };
}

export function EmployeeModal({
  isOpen,
  mode,
  employee,
  onClose,
  onSave,
  onDelete,
}: EmployeeModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unique options derived from the authorized headcount table
  const areas = useMemo(
    () => Array.from(new Set(PLANTILLA_AUTORIZADA.map((p) => p.area))),
    []
  );
  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          PLANTILLA_AUTORIZADA.filter((p) => p.area === form.area).map((p) => p.seccion)
        )
      ),
    [form.area]
  );
  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          PLANTILLA_AUTORIZADA.filter(
            (p) => p.area === form.area && p.seccion === form.seccion
          ).map((p) => p.puesto)
        )
      ),
    [form.area, form.seccion]
  );

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);

    if (mode === 'delete' && employee) {
      setForm({
        num_empleado: employee.num_empleado,
        nombre: employee.nombre,
        area: employee.area,
        seccion: employee.seccion,
        puesto: employee.puesto,
        categoria: employee.categoria,
        turno: employee.turno,
        fecha_ingreso: employee.fecha_ingreso,
      });
    } else {
      setForm(emptyForm());
    }
  }, [isOpen, mode, employee]);

  const isAddValid =
    form.num_empleado.trim().length > 0 &&
    form.nombre.trim().length > 0 &&
    form.area.length > 0 &&
    form.seccion.length > 0 &&
    form.puesto.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      if (mode === 'add' && onSave) {
        const result = await onSave({ ...form });
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo guardar.');
          return;
        }
        onClose();
      } else if (mode === 'delete' && onDelete && form.num_empleado) {
        const result = await onDelete(form.num_empleado);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo eliminar.');
          return;
        }
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isAdd = mode === 'add';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="employee-modal"
      icon={
        isAdd ? (
          <UserPlus size={20} className="color-primary" aria-hidden="true" />
        ) : (
          <Trash2 size={20} className="color-error" aria-hidden="true" />
        )
      }
      title={isAdd ? 'Nuevo Empleado' : 'Eliminar Empleado'}
      subtitle={isAdd ? 'Registro manual' : 'Acción irreversible'}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        {isAdd ? (
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="emp-num">Número de Empleado</label>
              <input
                id="emp-num"
                type="text"
                inputMode="numeric"
                required
                value={form.num_empleado}
                onChange={(e) => setForm({ ...form, num_empleado: e.target.value.trim() })}
                placeholder="Ej. 1234"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-name">Nombre Completo</label>
              <input
                id="emp-name"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                placeholder="APELLIDOS NOMBRE"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-area">Área</label>
              <select
                id="emp-area"
                required
                value={form.area}
                onChange={(e) =>
                  setForm({ ...form, area: e.target.value, seccion: '', puesto: '' })
                }
              >
                <option value="">Seleccione área…</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="emp-seccion">Sección</label>
              <select
                id="emp-seccion"
                required
                value={form.seccion}
                onChange={(e) => setForm({ ...form, seccion: e.target.value, puesto: '' })}
                disabled={!form.area}
              >
                <option value="">Seleccione sección…</option>
                {sectionsForArea.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="emp-puesto">Puesto</label>
              <select
                id="emp-puesto"
                required
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                disabled={!form.seccion}
              >
                <option value="">Seleccione puesto…</option>
                {puestosForSection.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="emp-turno">Turno</label>
              <select
                id="emp-turno"
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
              >
                <option value="0">Administrativo (0)</option>
                <option value="1">1er Turno</option>
                <option value="2">2do Turno</option>
                <option value="3">3er Turno</option>
                <option value="4">4to Turno</option>
                <option value="5">5to Turno</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="emp-fecha">Fecha de Ingreso</label>
              <input
                id="emp-fecha"
                type="date"
                value={form.fecha_ingreso}
                onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="delete-warning">
            <div className="delete-warning__icon" aria-hidden="true">
              <AlertCircle size={32} />
            </div>
            <p className="delete-warning__title">
              ¿Eliminar a{' '}
              <span className="delete-warning__name">{form.nombre || 'este empleado'}</span>?
            </p>
            <dl className="delete-warning__meta">
              <div className="delete-warning__meta-row">
                <dt>Núm.</dt>
                <dd>{form.num_empleado || '—'}</dd>
              </div>
              <div className="delete-warning__meta-row">
                <dt>Puesto</dt>
                <dd>{form.puesto || '—'}</dd>
              </div>
              <div className="delete-warning__meta-row">
                <dt>Área</dt>
                <dd>{form.area || '—'}</dd>
              </div>
            </dl>
            <p className="delete-warning__sub">Esta acción no se puede deshacer.</p>
          </div>
        )}

        {errorMsg && (
          <p className="form-error" role="alert">{errorMsg}</p>
        )}

        <footer className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          {isAdd ? (
            <button type="submit" className="btn-primary" disabled={!isAddValid || submitting}>
              {submitting ? 'Guardando…' : 'Guardar empleado'}
            </button>
          ) : (
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Eliminando…' : 'Eliminar'}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}
