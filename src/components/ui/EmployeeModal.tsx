import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import type { AutoVacancy } from '@/lib/autoVacancies';
import { usePositions } from '@/lib/positions';
import { localTodayIso } from '@/lib/dates';
import {
  TRANSPORTE_NA,
  TRANSPORTE_PARADAS,
  TRANSPORTE_RUTAS,
} from '@/lib/transporte-routes';
import { Modal } from './Modal';
import { FormWizard } from './FormWizard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CustomSelect } from './CustomSelect';
import './EmployeeModal.css';

interface EmployeeModalProps {
  isOpen: boolean;
  mode: 'add' | 'delete';
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (
    num_empleado: string,
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string }
  ) => Promise<{ ok: boolean; message?: string }> | void;
  openVacancies?: AutoVacancy[];
}

type FormState = Pick<
  Employee,
  'num_empleado' | 'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso'
> & {
  ruta: string;
  parada: string;
};

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
    ruta: '',
    parada: '',
  };
}

export function EmployeeModal({
  isOpen,
  mode,
  employee,
  onClose,
  onSave,
  onDelete,
  openVacancies = [],
}: EmployeeModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bajaForm, setBajaForm] = useState({
    fecha_baja: localTodayIso(),
    tipo_baja: 'Renuncia Voluntaria',
    motivo_baja: '',
  });
  const [selectedVacancyIndex, setSelectedVacancyIndex] = useState(0);
  const isMobile = useIsMobile();

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
    setSelectedVacancyIndex(0);

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
        ruta: employee.ruta ?? '',
        parada: employee.parada ?? '',
      });
      setBajaForm({
        fecha_baja: localTodayIso(),
        tipo_baja: 'Renuncia Voluntaria',
        motivo_baja: '',
      });
    } else {
      // En modo 'add', pre-llenar con la primera vacante disponible
      if (openVacancies && openVacancies.length > 0) {
        const vacancy = openVacancies[0];
        setForm({
          num_empleado: '',
          nombre: '',
          area: vacancy.area,
          seccion: vacancy.seccion,
          puesto: vacancy.puesto,
          categoria: 'N/A',
          turno: '1',
          fecha_ingreso: localTodayIso(),
          ruta: '',
          parada: '',
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, mode, employee, openVacancies]);

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
        const payload: Employee = {
          ...form,
          ruta: form.ruta ? form.ruta : null,
          parada: form.parada ? form.parada : null,
        };
        const result = await onSave(payload);
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

  const fieldsIdentidad = (
    <>
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
    </>
  );

  const fieldsPosicion = 
    // Si hay vacantes disponibles y estamos en modo 'add', no mostrar selectores
    // porque se pre-llenan del selector de vacante
    openVacancies && openVacancies.length > 0 && mode === 'add' ? null : (
    <>
      <div className="form-group">
        <label htmlFor="emp-area">Área</label>
        <CustomSelect
          id="emp-area"
          value={form.area}
          onChange={(val) => setForm({ ...form, area: val, seccion: '', puesto: '' })}
          options={areas.map((a) => ({ value: a, label: a }))}
          placeholder="Seleccione área…"
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-seccion">Sección</label>
        <CustomSelect
          id="emp-seccion"
          value={form.seccion}
          onChange={(val) => setForm({ ...form, seccion: val, puesto: '' })}
          options={sectionsForArea.map((s) => ({ value: s, label: s }))}
          placeholder="Seleccione sección…"
          disabled={!form.area}
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-puesto">Puesto</label>
        <CustomSelect
          id="emp-puesto"
          value={form.puesto}
          onChange={(val) => setForm({ ...form, puesto: val })}
          options={puestosForSection.map((p) => ({ value: p, label: p }))}
          placeholder="Seleccione puesto…"
          disabled={!form.seccion}
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-turno">Turno</label>
        <CustomSelect
          id="emp-turno"
          value={form.turno}
          onChange={(val) => setForm({ ...form, turno: val })}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
          ]}
          placeholder="Turno..."
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-fecha">Fecha de Ingreso</label>
        <input
          id="emp-fecha"
          type="date"
          value={form.fecha_ingreso}
          onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })}
        />
        {String(form.fecha_ingreso).localeCompare(localTodayIso()) > 0 && (
          <p className="form-notice form-notice--warning">
            <AlertCircle size={14} aria-hidden="true" />
            <span>Iniciará en el futuro. No contará en KPIs ni Dashboard hasta esta fecha.</span>
          </p>
        )}
      </div>
    </>
  );

  const fieldsVacancySelector = openVacancies && openVacancies.length > 0 && mode === 'add' ? (
    <div className="form-group form-group--span-2">
      <label htmlFor="emp-vacancy">Vacante Disponible</label>
      <CustomSelect
        id="emp-vacancy"
        value={selectedVacancyIndex.toString()}
        onChange={(val) => {
          const idx = parseInt(val);
          setSelectedVacancyIndex(idx);
          const vacancy = openVacancies[idx];
          setForm({ ...form, area: vacancy.area, seccion: vacancy.seccion, puesto: vacancy.puesto });
        }}
        options={openVacancies.map((v, i) => ({
          value: i.toString(),
          label: `${v.area} - ${v.seccion} - ${v.puesto}`,
        }))}
      />
    </div>
  ) : null;

  const fieldsTransporte = (
    <>
      <div className="form-group">
        <label htmlFor="emp-ruta">Ruta</label>
        <CustomSelect
          id="emp-ruta"
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
        <label htmlFor="emp-parada">Parada</label>
        <CustomSelect
          id="emp-parada"
          value={form.parada}
          onChange={(val) => setForm({ ...form, parada: val })}
          options={TRANSPORTE_PARADAS.map((p) => ({ value: p, label: p }))}
          placeholder="Sin asignar"
          disabled={!form.ruta || form.ruta === TRANSPORTE_NA}
        />
      </div>
    </>
  );

  const errorNotice = errorMsg ? (
    <p className="form-error" role="alert">{errorMsg}</p>
  ) : null;

  const icon = isAdd ? (
    <UserPlus size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <Trash2 size={20} className="color-error" aria-hidden="true" />
  );
  const title = isAdd ? 'Nuevo Empleado' : 'Eliminar Empleado';
  const subtitle = isAdd ? 'Alta de Empleado' : 'Baja de Empleado';

  const deleteContent = (
    <div className="employee-modal__delete">
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

      <div className="form-grid employee-modal__baja-grid">
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
          <CustomSelect
            id="baja-tipo"
            value={bajaForm.tipo_baja}
            onChange={(val) => setBajaForm({ ...bajaForm, tipo_baja: val })}
            options={[
              { value: 'Renuncia', label: 'Renuncia' },
              { value: 'Ausentismo', label: 'Ausentismo' },
              { value: 'Rescisión de Contrato', label: 'Rescisión de Contrato' },
              { value: 'Termino de Contrato', label: 'Termino de Contrato' },
              { value: 'Solo Inducción', label: 'Solo Inducción' },
            ]}
          />
        </div>
        <div className="form-group form-group--span-2">
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
  );

  const actionButtons = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={submitting}
      >
        Cancelar
      </button>
      {isAdd ? (
        <button
          type="submit"
          className="btn-primary"
          disabled={!isAddValid || submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar empleado'}
        </button>
      ) : (
        <button
          type="submit"
          className="btn-danger"
          disabled={!isDeleteValid || submitting}
        >
          {submitting ? 'Registrando baja…' : 'Registrar Baja'}
        </button>
      )}
    </>
  );

  if (isMobile && isAdd) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="employee-modal modal-fullscreen-mobile modal-wizard-mobile"
        icon={icon}
        title={title}
        subtitle={subtitle}
      >
        <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
          <FormWizard
            onCancel={onClose}
            submitting={submitting}
            submitDisabled={!isAddValid}
            submitLabel="Guardar empleado"
            submittingLabel="Guardando…"
            notice={errorNotice}
            steps={[
              {
                id: 'identidad',
                title: 'Identidad',
                isValid:
                  form.num_empleado.trim().length > 0 &&
                  form.nombre.trim().length > 0,
                content: <div className="form-grid">{fieldsIdentidad}</div>,
              },
              {
                id: 'posicion',
                title: 'Posición',
                isValid:
                  form.area.length > 0 &&
                  form.seccion.length > 0 &&
                  form.puesto.length > 0,
                content: (
                  <div className="form-grid">
                    {fieldsVacancySelector}
                    {fieldsPosicion}
                  </div>
                ),
              },
              {
                id: 'transporte',
                title: 'Transporte',
                content: <div className="form-grid">{fieldsTransporte}</div>,
              },
            ]}
          />
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="employee-modal"
      icon={icon}
      title={title}
      subtitle={subtitle}
      size={isAdd ? 'lg' : 'md'}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        {isAdd ? (
          <div className="form-grid">
            {fieldsIdentidad}
            {fieldsVacancySelector}
            {fieldsPosicion}
            {fieldsTransporte}
          </div>
        ) : (
          deleteContent
        )}
        {isAdd && (
          <p className="form-hint">
            {openVacancies && openVacancies.length > 0 ? (
              <>Al guardar se crea un nuevo empleado y se cierra automáticamente la vacante seleccionada.</>
            ) : (
              <>Al guardar se crea un nuevo empleado. Si existen vacantes abiertas que coincidan con el área, sección y puesto, se <strong>cerrarán automáticamente</strong>.</>
            )}
          </p>
        )}
        {errorNotice}
        <footer className="modal-footer">{actionButtons}</footer>
      </form>
    </Modal>
  );
}
