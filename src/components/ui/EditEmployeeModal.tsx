import { useEffect, useMemo, useState } from 'react';
import { Pencil, AlertCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { usePositions } from '@/lib/positions';
import {
  TRANSPORTE_NA,
  TRANSPORTE_PARADAS,
  TRANSPORTE_RUTAS,
} from '@/lib/transporte-routes';
import { localTodayIso } from '@/lib/dates';
import { Modal } from './Modal';
import { CustomSelect } from './CustomSelect';
import './EditEmployeeModal.css';

interface EditEmployeeModalProps {
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

export function EditEmployeeModal({
  isOpen,
  employee,
  onClose,
  onSave,
}: EditEmployeeModalProps) {
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

  const icon = (
    <Pencil size={20} className="color-primary" aria-hidden="true" />
  );
  const title = 'Editar Empleado';
  const subtitle = employee ? `#${employee.num_empleado}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={icon}
      title={title}
      subtitle={subtitle}
      className="edit-employee-modal"
      size="lg"
      footerActions={
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
            form="edit-employee-form"
            className="btn-primary"
            disabled={!isValid || submitting}
          >
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      <form id="edit-employee-form" onSubmit={handleSubmit} className="modal-body" noValidate>
        <div className="form-grid">
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
            <CustomSelect
              id="edit-emp-area"
              value={form.area}
              onChange={(val) => setForm({ ...form, area: val, seccion: '', puesto: '' })}
              options={areas.map((a) => ({ value: a, label: a }))}
              placeholder="Seleccione área…"
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-seccion">Sección</label>
            <CustomSelect
              id="edit-emp-seccion"
              value={form.seccion}
              onChange={(val) => setForm({ ...form, seccion: val, puesto: '' })}
              options={sectionsForArea.map((s) => ({ value: s, label: s }))}
              placeholder="Seleccione sección…"
              disabled={!form.area}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-puesto">Puesto</label>
            <CustomSelect
              id="edit-emp-puesto"
              value={form.puesto}
              onChange={(val) => setForm({ ...form, puesto: val })}
              options={puestosForSection.map((p) => ({ value: p, label: p }))}
              placeholder="Seleccione puesto…"
              disabled={!form.seccion}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-turno">Turno</label>
            <CustomSelect
              id="edit-emp-turno"
              value={form.turno}
              onChange={(val) => setForm({ ...form, turno: val })}
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
              ]}
            />
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
            {String(form.fecha_ingreso).localeCompare(localTodayIso()) > 0 && (
              <p className="form-notice form-notice--warning">
                <AlertCircle size={14} aria-hidden="true" />
                <span>Iniciará en el futuro. No contará en KPIs ni Dashboard hasta esta fecha.</span>
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-ruta">Ruta</label>
            <CustomSelect
              id="edit-emp-ruta"
              value={form.ruta}
              onChange={(val) => {
                if (val === TRANSPORTE_NA) {
                  setForm({ ...form, ruta: val, parada: TRANSPORTE_NA });
                } else if (val === '') {
                  setForm({ ...form, ruta: '', parada: '' });
                } else {
                  const nextParada = form.parada === TRANSPORTE_NA ? '' : form.parada;
                  setForm({ ...form, ruta: val, parada: nextParada });
                }
              }}
              options={[
                { value: TRANSPORTE_NA, label: 'N/A — no toma transporte' },
                ...TRANSPORTE_RUTAS.map((r) => ({ value: r, label: r }))
              ]}
              placeholder="Sin asignar"
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-emp-parada">Parada</label>
            <CustomSelect
              id="edit-emp-parada"
              value={form.parada}
              onChange={(val) => setForm({ ...form, parada: val })}
              options={TRANSPORTE_PARADAS.map((p) => ({ value: p, label: p }))}
              placeholder="Sin asignar"
              disabled={!form.ruta || form.ruta === TRANSPORTE_NA}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="form-error" role="alert">
            {errorMsg}
          </p>
        )}

      </form>
    </Modal>
  );
}
