import { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Trash2,
  Calendar,
  UserCheck,
  AlertCircle,
  Bus,
  Save,
} from 'lucide-react';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import type { Employee } from '@/lib/types';
import type { AutoVacancy } from '@/lib/autoVacancies';
import { usePositions } from '@/lib/positions';
import { canonicalizeKeyPart, canonicalizePuesto } from '@/lib/utils';
import { CATEGORIAS } from '@/lib/constants';
import { localTodayIso } from '@/lib/dates';
import {
  TRANSPORTE_NA,
  TRANSPORTE_PARADAS,
  TRANSPORTE_RUTAS,
} from '@/lib/transporte-routes';
import { Tooltip } from './Tooltip';
import { SmartDatePicker } from './SmartDatePicker';
import { supabase } from '@/lib/supabase';
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
  is_starlite: boolean;
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
    is_starlite: false,
  };
}

/** Quita el sufijo de categoría (A/B/C/D) del puesto, preservando el resto. */
function stripCategoria(puesto: string): string {
  return puesto.replace(/\s+[A-D]$/i, '').trim();
}

interface VacancyOption {
  area: string;
  seccion: string;
  puesto: string;
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
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Vacantes seleccionables: deduplicadas por área+sección+puesto (ignorando la
  // categoría) y con el puesto SIN sufijo de categoría. La categoría la asigna
  // el usuario manualmente más abajo.
  const vacancyOptions = useMemo<VacancyOption[]>(() => {
    const seen = new Set<string>();
    const list: VacancyOption[] = [];
    for (const v of openVacancies) {
      const key = `${canonicalizeKeyPart(v.area)}|${canonicalizeKeyPart(
        v.seccion
      )}|${canonicalizePuesto(v.puesto)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ area: v.area, seccion: v.seccion, puesto: stripCategoria(v.puesto) });
    }
    return list;
  }, [openVacancies]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
    setIsSuccess(false);
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
        is_starlite: employee.is_starlite ?? false,
      });
      setBajaForm({
        fecha_baja: localTodayIso(),
        tipo_baja: 'Renuncia Voluntaria',
        motivo_baja: '',
      });
    } else {
      // En modo 'add', pre-llenar con la primera vacante disponible
      if (vacancyOptions.length > 0) {
        const vacancy = vacancyOptions[0];
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
          is_starlite: false,
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, mode, employee, vacancyOptions]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (errorMsg) setErrorMsg(null);
  }, [form, bajaForm]);

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

        // Retraso artificial para que se note la animación
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await onSave(payload);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo guardar.');
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else if (mode === 'delete' && onDelete && form.num_empleado) {
        // Retraso artificial para que se note la animación
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await onDelete(form.num_empleado, bajaForm);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo eliminar.');
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setErrorMsg('Error inesperado.');
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
    vacancyOptions.length > 0 && mode === 'add' ? null : (
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
            { value: 'Mixto', label: 'Mixto' },
          ]}
          placeholder="Turno..."
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-fecha">Fecha de Ingreso</label>
        <SmartDatePicker
          value={form.fecha_ingreso}
          onChange={(val) => setForm({ ...form, fecha_ingreso: val })}
          presets="past"
        />
      </div>
    </>
  );

  const showVacancySelector = vacancyOptions.length > 0 && mode === 'add';

  const fieldsVacancySelector = showVacancySelector ? (
    <div className="form-group form-group--span-2">
      <label htmlFor="emp-vacancy">Vacante Disponible</label>
      <CustomSelect
        id="emp-vacancy"
        value={selectedVacancyIndex.toString()}
        onChange={(val) => {
          const idx = parseInt(val);
          setSelectedVacancyIndex(idx);
          const vacancy = vacancyOptions[idx];
          setForm({ ...form, area: vacancy.area, seccion: vacancy.seccion, puesto: vacancy.puesto });
        }}
        options={vacancyOptions.map((v, i) => ({
          value: i.toString(),
          label: `${v.area} - ${v.seccion} - ${v.puesto}`,
        }))}
      />
    </div>
  ) : null;

  // Cuando se usa el selector de vacante, `fieldsPosicion` se oculta y con él
  // su campo de Fecha de Ingreso. Lo reponemos aquí para no perderlo. Si NO hay
  // selector de vacante, `fieldsPosicion` ya incluye su propia Fecha de Ingreso.
  const fieldsFecha = showVacancySelector ? (
    <>
      <div className="form-group">
        <label htmlFor="emp-vac-categoria">Categoría</label>
        <CustomSelect
          id="emp-vac-categoria"
          value={form.categoria}
          onChange={(val) => setForm({ ...form, categoria: val })}
          options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
          placeholder="Categoría..."
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-vac-turno">Turno</label>
        <CustomSelect
          id="emp-vac-turno"
          value={form.turno}
          onChange={(val) => setForm({ ...form, turno: val })}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: 'Mixto', label: 'Mixto' },
          ]}
          placeholder="Turno..."
        />
      </div>
      <div className="form-group">
        <label htmlFor="emp-vac-fecha">Fecha de Ingreso</label>
        <SmartDatePicker
          value={form.fecha_ingreso}
          onChange={(val) => setForm({ ...form, fecha_ingreso: val })}
          presets="past"
        />
      </div>
    </>
  ) : null;

  const fieldsTransporte = null;

  const fieldsExtra = (
    <div className="form-group employee-modal__starlite-toggle">
      <label htmlFor="emp-starlite" className="starlite-label">
        Starlite
      </label>
      <div className="starlite-switch-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: 'var(--control-height)' }}>
        <label className="switch">
          <input
            id="emp-starlite"
            type="checkbox"
            checked={form.is_starlite}
            onChange={(e) => setForm({ ...form, is_starlite: e.target.checked })}
          />
          <span className="slider round"></span>
        </label>
        <span className="starlite-text" style={{ fontSize: '13px', color: 'var(--color-body)' }}>
          {form.is_starlite ? 'Si' : 'No'}
        </span>
      </div>
    </div>
  );

  const errorNotice = null;

  const icon = isAdd ? (
    <UserPlus size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <Trash2 size={20} className="color-error" aria-hidden="true" />
  );
  const title = isAdd ? 'Nuevo Empleado' : 'Eliminar Empleado';
  const subtitle = undefined;

  const deleteContent = (
    <div className="employee-modal__delete">
      <div className="delete-warning">
        <p className="delete-warning__title">
          ¿Registrar baja de{' '}
          <span className="delete-warning__name">{form.nombre || 'este empleado'}</span>?
        </p>
        <p className="delete-warning__sub">Esta acción no se puede deshacer.</p>
      </div>

      <div className="form-grid employee-modal__baja-grid">
        <div className="form-group">
          <label htmlFor="baja-fecha">Fecha de Baja</label>
          <SmartDatePicker
            value={bajaForm.fecha_baja}
            onChange={(val) => setBajaForm({ ...bajaForm, fecha_baja: val })}
            presets="past"
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
        disabled={submitting || isSuccess}
      >
        Cancelar
      </button>
      {isAdd ? (
        String(form.fecha_ingreso).localeCompare(localTodayIso()) > 0 ? (
          <Tooltip
            side="top"
            content={
              <span style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'flex-start', textAlign: 'left' }}>
                <AlertCircle size={14} className="color-warning" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>No contará en KPIs ni Dashboard.</span>
              </span>
            }
          >
            <span style={{ display: 'inline-block' }}>
              <AnimatedSubmitButton
                isSubmitting={submitting}
                isSuccess={isSuccess}
                isError={!!errorMsg}
                errorText={errorMsg || undefined}
                idleText="Guardar"
                loadingText="Guardando..."
                successText="¡Guardado!"
                idleIcon={Save}
                className="btn-primary"
                disabled={!isAddValid}
              />
            </span>
          </Tooltip>
        ) : (
          <AnimatedSubmitButton
            isSubmitting={submitting}
            isSuccess={isSuccess}
            isError={!!errorMsg}
            errorText={errorMsg || undefined}
            idleText="Guardar"
            loadingText="Guardando..."
            successText="¡Guardado!"
            idleIcon={Save}
            className="btn-primary"
            disabled={!isAddValid}
          />
        )
      ) : (
        <AnimatedSubmitButton
          isSubmitting={submitting}
          isSuccess={isSuccess}
          isError={!!errorMsg}
          errorText={errorMsg || undefined}
          idleText="Registrar Baja"
          loadingText="Registrando baja..."
          successText="¡Baja registrada!"
          idleIcon={Trash2}
          className="btn-danger"
          disabled={!isDeleteValid}
        />
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
            submitLabel="Guardar"
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
                    {fieldsFecha}
                    {fieldsPosicion}
                  </div>
                ),
              },
              {
                id: 'transporte',
                title: 'Transporte',
                content: (
                  <div className="form-grid">
                    {fieldsTransporte}
                    {fieldsExtra}
                  </div>
                ),
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
            {fieldsFecha}
            {fieldsPosicion}
            {fieldsTransporte}
            {fieldsExtra}
          </div>
        ) : (
          deleteContent
        )}

        {errorNotice}
        <footer className="modal-footer">{actionButtons}</footer>
      </form>
    </Modal>
  );
}
