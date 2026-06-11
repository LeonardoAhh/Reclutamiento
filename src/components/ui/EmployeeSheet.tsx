import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
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
import './EmployeeSheet.css';

interface EmployeeSheetProps {
  isOpen: boolean;
  mode: 'add' | 'delete';
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (
    num_empleado: string,
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string }
  ) => Promise<{ ok: boolean; message?: string }> | void;
}

type FormState = Pick<
  Employee,
  'num_empleado' | 'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso'
> & {
  /**
   * `''` = sin asignar (se persiste como `null`).
   * `'N/A'` = empleado no toma transporte.
   * Cualquier otro valor debe pertenecer a `TRANSPORTE_RUTAS`.
   */
  ruta: string;
  /** Mismo convenio que `ruta`. Forzado a `N/A` cuando `ruta === 'N/A'`. */
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

export function EmployeeSheet({
  isOpen,
  mode,
  employee,
  onClose,
  onSave,
  onDelete,
}: EmployeeSheetProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bajaForm, setBajaForm] = useState({
    fecha_baja: localTodayIso(),
    tipo_baja: 'Renuncia Voluntaria',
    motivo_baja: '',
  });
  const isMobile = useIsMobile();

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
        ruta: employee.ruta ?? '',
        parada: employee.parada ?? '',
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
        // `ruta`/`parada` vacíos = null en Supabase (sin asignar).
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

  /* ── Campos del alta, agrupados para componer ambos layouts ──────────
     PC: un solo form-grid (diseño actual). Móvil: wizard de 3 pasos. */

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

  const fieldsPosicion = (
    <>
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
        {String(form.fecha_ingreso).localeCompare(localTodayIso()) > 0 && (
          <p className="color-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={14} aria-hidden="true" />
            Iniciará en el futuro. No contará en KPIs ni Dashboard hasta esta fecha.
          </p>
        )}
      </div>
    </>
  );

  const fieldsTransporte = (
    <>
      <div className="form-group">
        <label htmlFor="emp-ruta">Ruta</label>
        <select
          id="emp-ruta"
          value={form.ruta}
          onChange={(e) => {
            const value = e.target.value;
            // Si elige N/A, la parada también queda N/A (no aplica).
            // Si elige vacío, parada también se limpia para evitar
            // dejar paradas huérfanas en el registro.
            if (value === TRANSPORTE_NA) {
              setForm({ ...form, ruta: value, parada: TRANSPORTE_NA });
            } else if (value === '') {
              setForm({ ...form, ruta: '', parada: '' });
            } else {
              // Si venía de N/A y elige ruta real, limpia parada para
              // que el usuario seleccione una válida.
              const nextParada =
                form.parada === TRANSPORTE_NA ? '' : form.parada;
              setForm({ ...form, ruta: value, parada: nextParada });
            }
          }}
        >
          <option value="">Sin asignar</option>
          <option value={TRANSPORTE_NA}>N/A — no toma transporte</option>
          {TRANSPORTE_RUTAS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="emp-parada">Parada</label>
        <select
          id="emp-parada"
          value={form.parada}
          onChange={(e) => setForm({ ...form, parada: e.target.value })}
          disabled={!form.ruta || form.ruta === TRANSPORTE_NA}
        >
          <option value="">Sin asignar</option>
          {TRANSPORTE_PARADAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
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

      <div className="form-grid employee-sheet__baja-grid">
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

  if (!isMobile) {
    /* ── PC: modal centrado, igual que las demás páginas ── */
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="employee-sheet employee-modal"
        icon={icon}
        title={title}
        subtitle={subtitle}
      >
        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {isAdd ? (
            <div className="form-grid">
              {fieldsIdentidad}
              {fieldsPosicion}
              {fieldsTransporte}
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

  /* ── Móvil: modal fullscreen (cohesivo con Nuevo Candidato) ── */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`employee-sheet employee-modal modal-fullscreen-mobile${
        isAdd ? ' modal-wizard-mobile' : ''
      }`}
      icon={icon}
      title={title}
      subtitle={subtitle}
    >
      {isAdd ? (
        /* Alta por pasos en móvil */
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
                content: <div className="form-grid">{fieldsPosicion}</div>,
              },
              {
                id: 'transporte',
                title: 'Transporte',
                content: <div className="form-grid">{fieldsTransporte}</div>,
              },
            ]}
          />
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {deleteContent}
          {errorNotice}
          <footer className="modal-footer">{actionButtons}</footer>
        </form>
      )}
    </Modal>
  );
}
