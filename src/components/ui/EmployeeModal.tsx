import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { usePositions } from '@/lib/positions';
import { localTodayIso } from '@/lib/dates';
import { Modal } from './Modal';
import './EmployeeModal.css';

interface EmployeeModalProps {
  isOpen: boolean;
  mode: 'add' | 'delete';
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (num_empleado: string, bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string }) => Promise<{ ok: boolean; message?: string }> | void;
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
  const [bajaForm, setBajaForm] = useState({
    fecha_baja: localTodayIso(),
    tipo_baja: 'Renuncia Voluntaria',
    motivo_baja: '',
  });

  // Unique options derived from the authorized headcount table
  const { positions } = usePositions();
  const areas = useMemo(
    () => Array.from(new Set(positions.map((p) => p.area))),
    [positions]
  );
  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          positions.filter((p) => p.area === form.area).map((p) => p.seccion)
        )
      ),
    [positions, form.area]
  );
  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          positions.filter(
            (p) => p.area === form.area && p.seccion === form.seccion
          ).map((p) => p.puesto)
        )
      ),
    [positions, form.area, form.seccion]
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
      setBajaForm({
        fecha_baja: localTodayIso(),
        tipo_baja: 'Renuncia Voluntaria',
        motivo_baja: '',
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

  const isDeleteValid =
    bajaForm.fecha_baja !== '' &&
    bajaForm.tipo_baja !== '' &&
    bajaForm.motivo_baja.trim() !== '';

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
        const result = await onDelete(form.num_empleado, bajaForm);
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
      subtitle={isAdd ? 'Alta de Empleado' : 'Baja de Empleado'}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        {isAdd ? (
          <>
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
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="Mixto">Mixto</option>
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
          </>
        ) : (
          <div className="delete-flow">
            <div className="delete-warning">
              <p className="delete-warning__title">
                ¿Registrar baja de{' '}
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
              <p className="delete-warning__sub">El empleado será eliminado de la plantilla activa y enviado a la tabla de Bajas.</p>
            </div>

            <div className="form-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
              <div className="form-group">
                <label htmlFor="baja-fecha">Fecha de Baja</label>
                <input
                  id="baja-fecha"
                  type="date"
                  required
                  value={bajaForm.fecha_baja}
                  onChange={(e) => setBajaForm({ ...bajaForm, fecha_baja: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="baja-tipo">Tipo de Baja</label>
                <select
                  id="baja-tipo"
                  required
                  value={bajaForm.tipo_baja}
                  onChange={(e) => setBajaForm({ ...bajaForm, tipo_baja: e.target.value })}
                >
                  <option value="Renuncia">Renuncia</option>
                  <option value="Ausentismo">Ausentismo</option>
                  <option value="Rescisión de Contrato">Rescisión de Contrato</option>
                  <option value="Termino de Contrato">Termino de Contrato</option>
                  <option value="Solo Inducción">Solo Inducción</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="baja-motivo">Motivo de Baja</label>
                <input
                  id="baja-motivo"
                  type="text"
                  required
                  placeholder="Especifica el motivo..."
                  value={bajaForm.motivo_baja}
                  onChange={(e) => setBajaForm({ ...bajaForm, motivo_baja: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>
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
            <button type="submit" className="btn-danger" disabled={!isDeleteValid || submitting}>
              {submitting ? 'Registrando baja…' : 'Registrar Baja'}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}