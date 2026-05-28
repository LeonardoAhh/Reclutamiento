import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { usePositions } from '@/lib/positions';
import {
  TRANSPORTE_NA,
  TRANSPORTE_PARADAS,
  TRANSPORTE_RUTAS,
} from '@/lib/transporte-routes';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Sheet } from './Sheet';
import { Modal } from './Modal';
import './EditEmployeeSheet.css';

interface EditEmployeeSheetProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (
    num_empleado: string,
    fields: Partial<Pick<Employee, 'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso' | 'ruta' | 'parada'>>
  ) => Promise<{ ok: boolean; message?: string }>;
}

type FormState = Pick<
  Employee,
  'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso'
> & {
  ruta: string;
  parada: string;
};

export function EditEmployeeSheet({
  isOpen,
  employee,
  onClose,
  onSave,
}: EditEmployeeSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [form, setForm] = useState<FormState>({
    nombre: '',
    area: '',
    seccion: '',
    puesto: '',
    categoria: 'N/A',
    turno: '1',
    fecha_ingreso: '',
    ruta: '',
    parada: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          positions
            .filter((p) => p.area === form.area && p.seccion === form.seccion)
            .map((p) => p.puesto)
        )
      ),
    [positions, form.area, form.seccion]
  );

  useEffect(() => {
    if (!isOpen || !employee) return;
    setErrorMsg(null);
    setSubmitting(false);
    setForm({
      nombre: employee.nombre,
      area: employee.area,
      seccion: employee.seccion,
      puesto: employee.puesto,
      categoria: employee.categoria,
      turno: employee.turno,
      fecha_ingreso: employee.fecha_ingreso,
      ruta: employee.ruta ?? '',
      parada: employee.parada ?? '',
    });
  }, [isOpen, employee]);

  const isValid =
    form.nombre.trim().length > 0 &&
    form.area.length > 0 &&
    form.seccion.length > 0 &&
    form.puesto.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !employee) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const result = await onSave(employee.num_empleado, {
        nombre: form.nombre,
        area: form.area,
        seccion: form.seccion,
        puesto: form.puesto,
        categoria: form.categoria,
        turno: form.turno,
        fecha_ingreso: form.fecha_ingreso,
        ruta: form.ruta || null,
        parada: form.parada || null,
      });
      if (result && result.ok === false) {
        setErrorMsg(result.message ?? 'No se pudo guardar.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const formContent = (
    <form
      onSubmit={handleSubmit}
      className="edit-employee__form"
      noValidate
    >
      <div className={isDesktop ? 'modal-body' : 'sheet__body'}>
        <div className="form-grid edit-employee__grid">
          <div className="form-group">
            <label htmlFor="edit-emp-name">Nombre Completo</label>
            <input
              id="edit-emp-name"
              type="text"
              required
              value={form.nombre}
              onChange={(e) =>
                setForm({ ...form, nombre: e.target.value.toUpperCase() })
              }
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-area">Área</label>
            <select
              id="edit-emp-area"
              required
              value={form.area}
              onChange={(e) =>
                setForm({ ...form, area: e.target.value, seccion: '', puesto: '' })
              }
            >
              <option value="">Seleccione área…</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-seccion">Sección</label>
            <select
              id="edit-emp-seccion"
              required
              value={form.seccion}
              onChange={(e) =>
                setForm({ ...form, seccion: e.target.value, puesto: '' })
              }
              disabled={!form.area}
            >
              <option value="">Seleccione sección…</option>
              {sectionsForArea.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-puesto">Puesto</label>
            <select
              id="edit-emp-puesto"
              required
              value={form.puesto}
              onChange={(e) => setForm({ ...form, puesto: e.target.value })}
              disabled={!form.seccion}
            >
              <option value="">Seleccione puesto…</option>
              {puestosForSection.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-turno">Turno</label>
            <select
              id="edit-emp-turno"
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value })}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-fecha">Fecha de Ingreso</label>
            <input
              id="edit-emp-fecha"
              type="date"
              value={form.fecha_ingreso}
              onChange={(e) =>
                setForm({ ...form, fecha_ingreso: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-ruta">Ruta</label>
            <select
              id="edit-emp-ruta"
              value={form.ruta}
              onChange={(e) => {
                const value = e.target.value;
                if (value === TRANSPORTE_NA) {
                  setForm({ ...form, ruta: value, parada: TRANSPORTE_NA });
                } else if (value === '') {
                  setForm({ ...form, ruta: '', parada: '' });
                } else {
                  const nextParada =
                    form.parada === TRANSPORTE_NA ? '' : form.parada;
                  setForm({ ...form, ruta: value, parada: nextParada });
                }
              }}
            >
              <option value="">Sin asignar</option>
              <option value={TRANSPORTE_NA}>N/A — no toma transporte</option>
              {TRANSPORTE_RUTAS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-parada">Parada</label>
            <select
              id="edit-emp-parada"
              value={form.parada}
              onChange={(e) => setForm({ ...form, parada: e.target.value })}
              disabled={!form.ruta || form.ruta === TRANSPORTE_NA}
            >
              <option value="">Sin asignar</option>
              {TRANSPORTE_PARADAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <p className="form-error" role="alert">
            {errorMsg}
          </p>
        )}
      </div>

      <footer className={isDesktop ? 'modal-footer' : 'sheet__footer'}>
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
          disabled={!isValid || submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </footer>
    </form>
  );

  const icon = (
    <Pencil size={20} className="color-primary" aria-hidden="true" />
  );
  const title = 'Editar Empleado';
  const subtitle = employee
    ? `#${employee.num_empleado}`
    : '';

  if (isDesktop) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={icon}
        title={title}
        subtitle={subtitle}
        className="edit-employee-modal"
      >
        {formContent}
      </Modal>
    );
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      icon={icon}
      title={title}
      subtitle={subtitle}
      className="edit-employee-sheet"
      side="right"
      width="md"
    >
      {formContent}
    </Sheet>
  );
}
