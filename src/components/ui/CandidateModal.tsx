import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Pencil, Trash2, Save } from 'lucide-react';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import { usePositions } from '@/lib/positions';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { calculatePositionCoverage, formatPhoneNumber } from '@/lib/utils';
import { localTodayIso, localDateToIso, isoToLocalDateString } from '@/lib/dates';
import { X, Search } from 'lucide-react';
import { SmartDatePicker } from './SmartDatePicker';
import { supabase } from '@/lib/supabase';
import { Modal } from './Modal';
import { FormWizard } from './FormWizard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Tooltip } from './Tooltip';
import './CandidateModal.css';
import { CustomSelect } from './CustomSelect';
import { CANDIDATE_SOURCES } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';

/**
 * Reclutadoras activas que pueden ser asignadas a un proceso.
 *
 * El `value` se guarda en MAYÚSCULAS para mantener consistencia con el
 * histórico (las normalizaciones en KPIs/Pipeline ya pasan por
 * `toUpperCase()`, pero almacenar uniforme evita mezcla en la base).
 * El `label` se muestra en formato amigable en el select.
 */
const RECLUTADORES_DISPONIBLES: Array<{ value: string; label: string }> = [
  { value: 'ALEXANDRA', label: 'Alexandra' },
  { value: 'DANIELA', label: 'Daniela' },
  { value: 'LEONARDO', label: 'Leonardo' },
];

type Mode = 'add' | 'edit' | 'delete';

interface CandidateModalProps {
  isOpen: boolean;
  mode: Mode;
  candidate?: Candidate | null;
  candidates?: Candidate[];
  onClose: () => void;
  onSave?: (
    payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (id: string) => Promise<{ ok: boolean; message?: string }> | void;
}

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  puesto: string;
  area: string;
  seccion: string;
  status: CandidateStatus;
  reclutador: string;
  source: string;
  cv_url: string;
  fecha_aplicacion: string;
  fecha_cita: string;
  is_starlite: boolean;
}

function emptyForm(): FormState {
  return {
    nombre: '',
    telefono: '',
    email: '',
    puesto: '',
    area: '',
    seccion: '',
    status: 'entrevista',
    reclutador: '',
    source: '',
    cv_url: '',
    fecha_aplicacion: localTodayIso(),
    fecha_cita: '',
    is_starlite: false,
  };
}

function fromCandidate(c: Candidate): FormState {
  return {
    nombre: c.nombre ?? '',
    telefono: c.telefono ?? '',
    email: c.email ?? '',
    puesto: c.puesto ?? '',
    area: c.area ?? '',
    seccion: c.seccion ?? '',
    status: c.status,
    reclutador: c.reclutador ?? '',
    source: c.source ?? '',
    cv_url: c.cv_url ?? '',
    fecha_aplicacion: c.fecha_aplicacion
      ? isoToLocalDateString(c.fecha_aplicacion)
      : localTodayIso(),
    fecha_cita: c.fecha_cita ? isoToLocalDateString(c.fecha_cita) : '',
    is_starlite: c.is_starlite ?? false,
  };
}

export function CandidateModal({
  isOpen,
  mode,
  candidate,
  candidates = [],
  onClose,
  onSave,
  onDelete,
}: CandidateModalProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  // En edición, `source` y `fecha_cita` pueden ser modificados tanto por
  // admin como por reclutador. El resto de campos sigue bloqueado en
  // edición (estado/proceso se edita desde la fila directamente).
  const canEditCitaAndSource = isAdmin || profile?.role === 'reclutador';
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { positions } = usePositions();
  const { employees, comments } = useSupabaseData();

  /**
   * Cobertura actual de cada puesto. Sirve para detectar qué puestos
   * realmente tienen vacante abierta (plantilla autorizada o backup
   * sin cubrir) y limitar la captura a esos.
   */
  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments, positions),
    [employees, comments, positions]
  );

  /**
   * Set de puestos con vacante abierta (`vacantes > 0`). Usamos
   * área|sección|puesto como clave estricta para que un mismo puesto
   * en distintos turnos se traten por separado.
   */
  const openPositionsKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const p of positionCoverage) {
      if (p.vacantes > 0) {
        s.add(`${p.area}||${p.seccion ?? ''}||${p.puesto}`);
      }
    }
    return s;
  }, [positionCoverage]);

  /**
   * Solo en modo "Agregar" restringimos a posiciones con vacante.
   * Al editar un candidato existente respetamos los valores capturados
   * aunque el puesto ya esté cubierto.
   */
  const restrictToOpen = mode === 'add';
  const openPositions = useMemo(
    () =>
      restrictToOpen
        ? positions.filter((p) =>
            openPositionsKeySet.has(`${p.area}||${p.seccion ?? ''}||${p.puesto}`)
          )
        : positions,
    [positions, openPositionsKeySet, restrictToOpen]
  );

  const areas = useMemo(
    () => Array.from(new Set(openPositions.map((p) => p.area))).sort(),
    [openPositions]
  );
  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter((p) => p.area === form.area)
            .map((p) => p.seccion)
        )
      ).sort(),
    [openPositions, form.area]
  );
  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter(
              (p) => p.area === form.area && p.seccion === form.seccion
            )
            .map((p) => p.puesto)
        )
      ).sort(),
    [openPositions, form.area, form.seccion]
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsSuccess(false);
      setSubmitting(false);
      setForm(candidate ? fromCandidate(candidate) : emptyForm());
    }
  }, [isOpen, candidate, mode]);

  const missingRequiredFields = [
    !form.nombre.trim() && 'Nombre completo',
    !form.telefono.trim() && 'Teléfono',
    !form.area && 'Área',
    !form.seccion && 'Sección',
    !form.puesto && 'Puesto',
  ].filter(Boolean) as string[];

  const isFormValid = missingRequiredFields.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);

      if (mode === 'add' || mode === 'edit') {
        const telDigits = form.telefono.replace(/\D/g, '');
        if (telDigits && telDigits.length !== 10) {
          setErrorMsg('El teléfono debe tener exactamente 10 dígitos.');
          setSubmitting(false);
          return;
        }

        // Duplicate check (only check if changed or adding)
        if (candidates.length > 0) {
          const isDupPhone = candidates.some(c =>
            c.id !== candidate?.id &&
            c.telefono &&
            c.telefono.replace(/\D/g, '') === telDigits &&
            telDigits.length === 10
          );
          if (isDupPhone) {
            setErrorMsg('Este número de teléfono ya está registrado en otro candidato.');
            setSubmitting(false);
            return;
          }

          if (form.email.trim()) {
            const isDupEmail = candidates.some(c =>
              c.id !== candidate?.id &&
              c.email &&
              c.email.trim().toLowerCase() === form.email.trim().toLowerCase()
            );
            if (isDupEmail) {
              setErrorMsg('Este correo electrónico ya está registrado en otro candidato.');
              setSubmitting(false);
              return;
            }
          }
        }
      }

      if (mode === 'delete' && onDelete && candidate?.id) {
        // Retraso artificial para que se note la animación de "pensando"
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await onDelete(candidate.id);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo eliminar.');
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
        return;
      }

      if ((mode === 'add' || mode === 'edit') && onSave) {
        const payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'> = {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
          puesto: form.puesto,
          area: form.area,
          seccion: form.seccion || null,
          status: form.status,
          reclutador: form.reclutador.trim() || null,
          source: form.source.trim() || null,
          cv_url: form.cv_url.trim() || null,
          fecha_aplicacion:
            localDateToIso(form.fecha_aplicacion) ?? new Date().toISOString(),
          // `fecha_cita` se guarda como date (YYYY-MM-DD) — el <input type="date">
          // ya entrega ese formato. Vacío = sin cita programada (null).
          fecha_cita: form.fecha_cita ? form.fecha_cita : null,
          is_starlite: form.is_starlite,
        };
        
        // Retraso artificial para que se note la animación de "pensando"
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await onSave(payload, candidate?.id);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo guardar.');
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado.');
      setSubmitting(false);
    }
  }

  const isAdd = mode === 'add';
  const isEdit = mode === 'edit';
  const isDelete = mode === 'delete';



  const icon = isDelete ? (
    <Trash2 size={20} className="color-error" aria-hidden="true" />
  ) : isEdit ? (
    <Pencil size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <UserPlus size={20} className="color-primary" aria-hidden="true" />
  );

  const title = isDelete
    ? 'Eliminar candidato'
    : isEdit
      ? 'Editar candidato'
      : 'Nuevo candidato';

  const subtitle = undefined;

  /* ── Campos agrupados para componer ambos layouts ────────────────────
     PC: un solo form-grid (diseño actual). Móvil: wizard de 3 pasos. */

  const fieldsContacto = (
    <>
      <div className="form-group form-group--span-2">
        <label htmlFor="cand-nombre">Nombre completo</label>
        <input
          id="cand-nombre"
          type="text"
          required
          value={form.nombre}
          onChange={(e) =>
            setForm({ ...form, nombre: e.target.value.toUpperCase() })
          }
          placeholder="APELLIDOS NOMBRE"
          autoComplete="off"
          disabled={isEdit}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-telefono">Teléfono</label>
        <input
          id="cand-telefono"
          type="tel"
          inputMode="tel"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          onBlur={() => setForm({ ...form, telefono: formatPhoneNumber(form.telefono) })}
          placeholder="442 123 4567"
          autoComplete="off"
          disabled={isEdit}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-email">Email</label>
        <input
          id="cand-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="candidato@correo.com"
          autoComplete="off"
          disabled={isEdit}
        />
      </div>
    </>
  );

  const noOpenPositions = restrictToOpen && areas.length === 0;

const fieldsPosicion = (
    <>
      <div className="form-group">
        <label htmlFor="cand-area">
          Área
          {restrictToOpen && (
            <span className="candidate-modal__hint" role="note">
              {noOpenPositions
                ? <span className="candidate-modal__hint--warning">Sin vacantes abiertas</span>
                : <>Solo puestos con vacante abierta</>}
            </span>
          )}
        </label>
        <CustomSelect
          id="cand-area"
          value={form.area}
          onChange={(val) => setForm({ ...form, area: val, seccion: '', puesto: '' })}
          options={areas.map((a) => ({ value: a, label: a }))}
          placeholder="Seleccione área…"
          disabled={isEdit || noOpenPositions}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-seccion">Sección</label>
        <CustomSelect
          id="cand-seccion"
          value={form.seccion}
          onChange={(val) => setForm({ ...form, seccion: val, puesto: '' })}
          options={sectionsForArea.map((s) => ({ value: s, label: s }))}
          placeholder="Seleccione sección…"
          disabled={!form.area || isEdit}
        />
      </div>

      <div className="form-group form-group--span-2">
        <label htmlFor="cand-puesto">Puesto</label>
        <CustomSelect
          id="cand-puesto"
          value={form.puesto}
          onChange={(val) => setForm({ ...form, puesto: val })}
          options={puestosForSection.map((p) => ({ value: p, label: p }))}
          placeholder="Seleccione puesto…"
          disabled={!form.seccion || isEdit}
        />
      </div>
    </>
  );

  const fieldsProceso = (
    <>
      <div className="form-group">
        <label htmlFor="cand-status">Proceso</label>
        <CustomSelect
          id="cand-status"
          value={form.status}
          onChange={(val) => setForm({ ...form, status: val as CandidateStatus })}
          options={CANDIDATE_STATUSES.map((s) => ({ value: s, label: CANDIDATE_STATUS_LABEL[s] }))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-reclutador">Reclutador</label>
        <CustomSelect
          id="cand-reclutador"
          value={form.reclutador}
          onChange={(val) => setForm({ ...form, reclutador: val })}
          placeholder="Quién lleva el proceso"
          options={RECLUTADORES_DISPONIBLES}
          disabled={isEdit}
          aria-label="Reclutador a cargo del proceso"
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-source">Fuente</label>
        <input
          id="cand-source"
          type="text"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          placeholder="LinkedIn · Indeed · Referido…"
          autoComplete="off"
          list="cand-source-suggestions"
          disabled={isEdit && !canEditCitaAndSource}
          data-testid="cand-source-input"
        />
        <datalist id="cand-source-suggestions">
          {CANDIDATE_SOURCES.map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div className="form-group candidate-modal__starlite-toggle">
        <label htmlFor="cand-starlite" className="starlite-label">
          Etiqueta Starlite
        </label>
        <div className="starlite-switch-container">
          <label className="switch">
            <input
              id="cand-starlite"
              type="checkbox"
              checked={form.is_starlite}
              onChange={(e) => setForm({ ...form, is_starlite: e.target.checked })}
              disabled={isEdit && !isAdmin}
            />
            <span className="slider round"></span>
          </label>
          <span className="starlite-text">{form.is_starlite ? 'Sí (Candidato Starlite)' : 'No'}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="cand-fecha">Fecha de contacto</label>
        <SmartDatePicker
          value={form.fecha_aplicacion}
          onChange={(val) => setForm({ ...form, fecha_aplicacion: val })}
          disabled={isEdit}
          presets="past"
        />
      </div>

      <div className="form-group">
        <label htmlFor="cand-fecha-cita">Fecha de entrevista</label>
        <SmartDatePicker
          value={form.fecha_cita}
          onChange={(val) => setForm({ ...form, fecha_cita: val })}
          disabled={isEdit && !canEditCitaAndSource}
          placeholder="Sin fecha agendada"
          presets="future"
        />
      </div>
    </>
  );

  const errorNotice = errorMsg ? (
    <p className="form-error" role="alert">{errorMsg}</p>
  ) : null;

  const auditNotice = (isAdmin && isEdit && candidate) ? (
    <div className="form-group form-group--span-2 candidate-modal__audit">
      <h4><ShieldAlert size={16} aria-hidden="true" /> Auditoría de Sistema</h4>
      <div className="candidate-modal__audit-grid">
        <div>
          <span className="candidate-modal__audit-label">Fecha de Creación:</span>
          <span>{candidate.created_at ? new Date(candidate.created_at).toLocaleString() : 'N/A'}</span>
        </div>
        <div>
          <span className="candidate-modal__audit-label">Última Modificación:</span>
          <span>{candidate.updated_at ? new Date(candidate.updated_at).toLocaleString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  ) : null;

  const useWizard = !isDelete && isMobile;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`candidate-modal modal-fullscreen-mobile${
        useWizard ? ' modal-wizard-mobile' : ''
      }`}
      icon={icon}
      title={title}
      subtitle={subtitle}
    >
      {useWizard ? (
        /* ── Móvil: registro por pasos ── */
        <form
          onSubmit={handleSubmit}
          className="modal-wizard-form"
          noValidate
        >
          <FormWizard
            onCancel={onClose}
            submitting={submitting}
            submitDisabled={!isFormValid}
            submitLabel="Guardar"
            submittingLabel="Guardando…"
            notice={errorMsg ? errorNotice : null}
            steps={[
              {
                id: 'contacto',
                title: 'Contacto',
                isValid: form.nombre.trim().length > 0,
                content: <div className="form-grid">{fieldsContacto}</div>,
              },
              {
                id: 'posicion',
                title: 'Posición',
                isValid: form.area.length > 0 && form.puesto.length > 0,
                content: <div className="form-grid">{fieldsPosicion}</div>,
              },
              {
                id: 'proceso',
                title: 'Proceso',
                content: <div className="form-grid">
                  {fieldsProceso}
                  {auditNotice}
                </div>,
              },
            ]}
          />
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {isDelete ? (
            <div className="delete-warning">
              <p className="delete-warning__title">
                ¿Eliminar a{' '}
                <span className="delete-warning__name">{form.nombre || 'este candidato'}</span>?
              </p>
            </div>
          ) : (
            <div className="form-grid">
              {fieldsContacto}
              {fieldsPosicion}
              {fieldsProceso}
              {auditNotice}
            </div>
          )}

          {errorNotice}

          <footer className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting || isSuccess}
            >
              Cancelar
            </button>
            {isDelete ? (
              <AnimatedSubmitButton
                isSubmitting={submitting}
                isSuccess={isSuccess}
                idleText="Eliminar"
                loadingText="Eliminando..."
                successText="¡Eliminado!"
                idleIcon={Trash2}
                className="btn-danger"
              />
            ) : !isFormValid ? (
              <Tooltip content="Faltan campos obligatorios">
                <span tabIndex={0} style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                  <div style={{ pointerEvents: 'none' }}>
                    <AnimatedSubmitButton
                      isSubmitting={submitting}
                      isSuccess={isSuccess}
                      idleText="Guardar"
                      loadingText="Guardando..."
                      successText="¡Guardado!"
                      idleIcon={Save}
                      className="btn-primary"
                      disabled={true}
                    />
                  </div>
                </span>
              </Tooltip>
            ) : (
              <AnimatedSubmitButton
                isSubmitting={submitting}
                isSuccess={isSuccess}
                idleText="Guardar"
                loadingText="Guardando..."
                successText="¡Guardado!"
                idleIcon={Save}
                className="btn-primary"
                disabled={false}
              />
            )}
          </footer>
        </form>
      )}
    </Modal>
  );
}
