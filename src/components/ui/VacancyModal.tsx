import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Pencil,
  Trash2,
  AlertCircle,
  History,
  ArrowRight,
} from 'lucide-react';
import type {
  VacancyRequest,
  VacancyStatus,
  VacancyPriority,
  VacancyType,
  VacancyStatusHistoryEntry,
} from '@/lib/types';
import {
  VACANCY_STATUSES,
  VACANCY_STATUS_LABEL,
  VACANCY_PRIORITIES,
  VACANCY_PRIORITY_LABEL,
  VACANCY_EXCLUSION_REASONS,
  VACANCY_TYPES,
  VACANCY_TYPE_LABEL,
  DEFAULT_VACANCY_SLA_DAYS,
} from '@/lib/types';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { usePositions } from '@/lib/positions';
import {
  localTodayIso,
  localDateToIso,
  isoToLocalDateString,
  addBusinessDays,
  TZ_MX,
} from '@/lib/dates';
import { Modal } from './Modal';
import { FormWizard } from './FormWizard';
import { CustomSelect } from './CustomSelect';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CANDIDATE_SOURCES } from '@/lib/types';
import './VacancyModal.css';

type Mode = 'add' | 'edit' | 'delete';

interface VacancyModalProps {
  isOpen: boolean;
  mode: Mode;
  vacancy?: VacancyRequest | null;
  history?: VacancyStatusHistoryEntry[];
  onClose: () => void;
  onSave?: (
    payload: Omit<VacancyRequest, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (id: string) => Promise<{ ok: boolean; message?: string }> | void;
}

interface FormState {
  area: string;
  seccion: string;
  puesto: string;
  status: VacancyStatus;
  prioridad: VacancyPriority;
  reclutador_asignado_1: string;
  reclutador_asignado_2: string;
  fuente_planeada_1: string;
  fuente_planeada_2: string;
  fecha_apertura: string;
  fecha_objetivo: string;
  fecha_cubierta: string;
  justificacion: string;
  dias_sla: number;
  excluida_indicador: boolean;
  motivo_exclusion: string;
  // ── Proyecto ──
  tipo: VacancyType;
  proyecto: string;
  cantidad: number;
  fecha_inicio_proyecto: string;
}

function todayIso(): string {
  return localTodayIso();
}

function emptyForm(): FormState {
  return {
    area: '',
    seccion: '',
    puesto: '',
    status: 'abierta',
    prioridad: 'media',
    reclutador_asignado_1: '',
    reclutador_asignado_2: '',
    fuente_planeada_1: '',
    fuente_planeada_2: '',
    fecha_apertura: todayIso(),
    fecha_objetivo: '',
    fecha_cubierta: '',
    justificacion: '',
    dias_sla: DEFAULT_VACANCY_SLA_DAYS,
    excluida_indicador: false,
    motivo_exclusion: '',
    tipo: 'organica',
    proyecto: '',
    cantidad: 1,
    fecha_inicio_proyecto: '',
  };
}

function fromVacancy(v: VacancyRequest): FormState {
  return {
    area: v.area ?? '',
    seccion: v.seccion ?? '',
    puesto: v.puesto ?? '',
    status: v.status,
    prioridad: v.prioridad,
    reclutador_asignado_1: (v.reclutador_asignado || '').split(',')[0]?.trim() || '',
    reclutador_asignado_2: (v.reclutador_asignado || '').split(',')[1]?.trim() || '',
    fuente_planeada_1: (v.fuente_planeada || '').split(',')[0]?.trim() || '',
    fuente_planeada_2: (v.fuente_planeada || '').split(',')[1]?.trim() || '',
    fecha_apertura: v.fecha_apertura
      ? isoToLocalDateString(v.fecha_apertura)
      : localTodayIso(),
    fecha_objetivo: isoToLocalDateString(v.fecha_objetivo),
    fecha_cubierta: isoToLocalDateString(v.fecha_cubierta),
    justificacion: v.justificacion ?? '',
    dias_sla: v.dias_sla ?? DEFAULT_VACANCY_SLA_DAYS,
    excluida_indicador: !!v.excluida_indicador,
    motivo_exclusion: v.motivo_exclusion ?? '',
    tipo: v.tipo ?? 'organica',
    proyecto: v.proyecto ?? '',
    cantidad: v.cantidad ?? 1,
    fecha_inicio_proyecto: isoToLocalDateString(v.fecha_inicio_proyecto),
  };
}

export function VacancyModal({
  isOpen,
  mode,
  vacancy,
  history,
  onClose,
  onSave,
  onDelete,
}: VacancyModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setForm(vacancy ? fromVacancy(vacancy) : emptyForm());
  }, [isOpen, vacancy, mode]);

  useEffect(() => {
    if (form.fecha_apertura && form.dias_sla > 0) {
      const fechaObjetivo = addBusinessDays(form.fecha_apertura, form.dias_sla);
      if (fechaObjetivo && fechaObjetivo !== form.fecha_objetivo) {
        setForm((prev) => ({ ...prev, fecha_objetivo: fechaObjetivo }));
      }
    }
  }, [form.fecha_apertura, form.dias_sla]);

  const isFormValid =
    form.area.length > 0 &&
    form.puesto.length > 0 &&
    form.status.length > 0 &&
    (form.tipo !== 'proyecto' || form.proyecto.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);

      if (mode === 'delete' && onDelete && vacancy?.id) {
        const result = await onDelete(vacancy.id);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo eliminar.');
          return;
        }
        onClose();
        return;
      }

      if ((mode === 'add' || mode === 'edit') && onSave) {
        const fechaApertura =
          localDateToIso(form.fecha_apertura) ?? new Date().toISOString();
        const fechaObjetivo = localDateToIso(form.fecha_objetivo);

        let fechaCubierta: string | null = null;
        if (form.status === 'cubierta') {
          fechaCubierta =
            localDateToIso(form.fecha_cubierta) ?? new Date().toISOString();
        }

        const recruiters = [form.reclutador_asignado_1, form.reclutador_asignado_2].map(s => s.trim()).filter(Boolean);
        const sources = [form.fuente_planeada_1, form.fuente_planeada_2].map(s => s.trim()).filter(Boolean);

        const payload: Omit<VacancyRequest, 'id' | 'created_at' | 'updated_at'> = {
          area: form.area,
          seccion: form.seccion || null,
          puesto: form.puesto,
          status: form.status,
          prioridad: form.prioridad,
          reclutador_asignado: recruiters.length > 0 ? recruiters.join(', ') : null,
          fuente_planeada: sources.length > 0 ? sources.join(', ') : null,
          fecha_apertura: fechaApertura,
          fecha_objetivo: fechaObjetivo,
          fecha_cubierta: fechaCubierta,
          justificacion: form.justificacion.trim() || null,
          dias_sla: Number.isFinite(form.dias_sla) && form.dias_sla > 0
            ? Math.round(form.dias_sla)
            : DEFAULT_VACANCY_SLA_DAYS,
          excluida_indicador: form.excluida_indicador,
          motivo_exclusion: form.excluida_indicador
            ? form.motivo_exclusion.trim() || 'Sin seguimiento del área'
            : null,
          // ── Campos de proyecto ──
          tipo: form.tipo,
          proyecto: form.tipo === 'proyecto' ? form.proyecto.trim() || null : null,
          cantidad: form.tipo === 'proyecto' ? Math.max(1, Math.round(form.cantidad)) : 1,
          fecha_inicio_proyecto: form.tipo === 'proyecto'
            ? (localDateToIso(form.fecha_inicio_proyecto) ?? null)
            : null,
        };
        const result = await onSave(payload, vacancy?.id);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo guardar.');
          return;
        }
        onClose();
      }
    } finally {
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
    <ClipboardList size={20} className="color-primary" aria-hidden="true" />
  );

  const title = isDelete
    ? 'Eliminar vacante'
    : isEdit
      ? 'Editar vacante'
      : 'Nueva vacante';

  const subtitle = isDelete
    ? 'Acción irreversible'
    : isEdit
      ? 'Ciclo de vida y prioridad'
      : 'Abrir solicitud de cobertura';

  const fieldsPosicion = (
    <>
      {/* Tipo de vacante — primer campo, condiciona el resto del formulario */}
      <div className="form-group form-group--span-2">
        <label htmlFor="vac-tipo">Tipo de vacante</label>
        <CustomSelect
          id="vac-tipo"
          value={form.tipo}
          onChange={(val) => setForm({ ...form, tipo: val as VacancyType })}
          options={VACANCY_TYPES.map((t) => ({ value: t, label: VACANCY_TYPE_LABEL[t] }))}
        />
      </div>

      {/* Campos adicionales que solo aparecen para vacantes de proyecto */}
      {form.tipo === 'proyecto' && (
        <>
          <div className="form-group">
            <label htmlFor="vac-proyecto">Nombre del proyecto *</label>
            <input
              id="vac-proyecto"
              type="text"
              value={form.proyecto}
              onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
              placeholder="Ej. StarLight, Ford Q3…"
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="vac-cantidad">Número de plazas</label>
            <input
              id="vac-cantidad"
              type="number"
              min={1}
              max={500}
              step={1}
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </div>
          <div className="form-group form-group--span-2">
            <label htmlFor="vac-inicio-proyecto">
              Fecha de inicio del proyecto
            </label>
            <input
              id="vac-inicio-proyecto"
              type="date"
              value={form.fecha_inicio_proyecto}
              onChange={(e) => setForm({ ...form, fecha_inicio_proyecto: e.target.value })}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="vac-area">Área *</label>
        <CustomSelect
          id="vac-area"
          value={form.area}
          onChange={(val) => setForm({ ...form, area: val, seccion: '', puesto: '' })}
          options={areas.map((a) => ({ value: a, label: a }))}
          placeholder="Seleccione área…"
        />
      </div>
      <div className="form-group">
        <label htmlFor="vac-seccion">Sección</label>
        <CustomSelect
          id="vac-seccion"
          value={form.seccion}
          onChange={(val) => setForm({ ...form, seccion: val, puesto: '' })}
          options={sectionsForArea.map((s) => ({ value: s, label: s }))}
          placeholder="Seleccione sección…"
          disabled={!form.area}
        />
      </div>
      <div className="form-group form-group--span-2">
        <label htmlFor="vac-puesto">Puesto *</label>
        <CustomSelect
          id="vac-puesto"
          value={form.puesto}
          onChange={(val) => setForm({ ...form, puesto: val })}
          options={puestosForSection.map((p) => ({ value: p, label: p }))}
          placeholder="Seleccione puesto…"
          disabled={!form.seccion}
        />
      </div>
    </>
  );

  const fieldsSeguimiento = (
    <>
      <div className="form-group">
        <label htmlFor="vac-status">Status</label>
        <CustomSelect
          id="vac-status"
          value={form.status}
          onChange={(val) => setForm({ ...form, status: val as VacancyStatus })}
          options={VACANCY_STATUSES.map((s) => ({ value: s, label: VACANCY_STATUS_LABEL[s] }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="vac-prioridad">Prioridad</label>
        <CustomSelect
          id="vac-prioridad"
          value={form.prioridad}
          onChange={(val) => setForm({ ...form, prioridad: val as VacancyPriority })}
          options={VACANCY_PRIORITIES.map((p) => ({ value: p, label: VACANCY_PRIORITY_LABEL[p] }))}
        />
      </div>
      <div className="form-group form-group--span-2">
        <label>Reclutadores asignados</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <CustomSelect
            id="vac-reclutador-1"
            value={form.reclutador_asignado_1}
            onChange={(val) => setForm({ ...form, reclutador_asignado_1: val })}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...RECLUTADORES_ACTIVOS.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }))
            ]}
            placeholder="Reclutador 1"
          />
          <CustomSelect
            id="vac-reclutador-2"
            value={form.reclutador_asignado_2}
            onChange={(val) => setForm({ ...form, reclutador_asignado_2: val })}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...RECLUTADORES_ACTIVOS.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }))
            ]}
            placeholder="Reclutador 2 (Opcional)"
          />
        </div>
      </div>
      <div className="form-group form-group--span-2">
        <label>Fuentes planeadas</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <CustomSelect
            id="vac-fuente-1"
            value={form.fuente_planeada_1}
            onChange={(val) => setForm({ ...form, fuente_planeada_1: val })}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...CANDIDATE_SOURCES.map((s) => ({ value: s, label: s }))
            ]}
            placeholder="Fuente 1"
          />
          <CustomSelect
            id="vac-fuente-2"
            value={form.fuente_planeada_2}
            onChange={(val) => setForm({ ...form, fuente_planeada_2: val })}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...CANDIDATE_SOURCES.map((s) => ({ value: s, label: s }))
            ]}
            placeholder="Fuente 2 (Opcional)"
          />
        </div>
      </div>
    </>
  );

  const fieldsDetalles = (
    <>
      <div className="form-group">
        <label htmlFor="vac-apertura">Fecha de apertura</label>
        <input
          id="vac-apertura"
          type="date"
          value={form.fecha_apertura}
          onChange={(e) => setForm({ ...form, fecha_apertura: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor="vac-sla">SLA (días hábiles)</label>
        <input
          id="vac-sla"
          type="number"
          min={1}
          max={365}
          step={1}
          value={form.dias_sla}
          disabled
          readOnly
          title="Días hábiles para cubrir la vacante (lunes a viernes, excluyendo festivos)"
        />
      </div>
      <div className="form-group">
        <label htmlFor="vac-objetivo">Fecha objetivo (calculada)</label>
        <input
          id="vac-objetivo"
          type="date"
          value={form.fecha_objetivo}
          disabled
          readOnly
          title="Se calcula automáticamente: Fecha de apertura + SLA días hábiles"
        />
      </div>
      {form.status === 'cubierta' && (
        <div className="form-group">
          <label htmlFor="vac-cubierta">Fecha cubierta</label>
          <input
            id="vac-cubierta"
            type="date"
            value={form.fecha_cubierta || todayIso()}
            onChange={(e) => setForm({ ...form, fecha_cubierta: e.target.value })}
          />
        </div>
      )}
      <div className="form-group form-group--span-2">
        <label htmlFor="vac-justificacion">Justificación</label>
        <textarea
          id="vac-justificacion"
          value={form.justificacion}
          onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
          placeholder="Por qué se abre la vacante (rotación, expansión, etc.)"
        />
      </div>

      <div className="form-group form-group--span-2">
        <label className="vacancy-modal__exclusion-toggle">
          <input
            type="checkbox"
            checked={form.excluida_indicador}
            onChange={(e) =>
              setForm({ ...form, excluida_indicador: e.target.checked })
            }
          />
          <span className="vacancy-modal__exclusion-label">
            <strong>Excluir del indicador</strong>
          </span>
        </label>
        {form.excluida_indicador && (
          <div className="vacancy-modal__exclusion-reason">
            <label htmlFor="vac-motivo">Motivo</label>
            <input
              id="vac-motivo"
              type="text"
              list="vac-motivo-suggestions"
              value={form.motivo_exclusion}
              onChange={(e) =>
                setForm({ ...form, motivo_exclusion: e.target.value })
              }
              placeholder="Sin seguimiento del área"
              autoComplete="off"
            />
            <datalist id="vac-motivo-suggestions">
              {VACANCY_EXCLUSION_REASONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
        )}
      </div>
    </>
  );

  const historyBlock =
    isEdit && history && history.length > 0 ? (
      <div className="vacancy-modal__timeline" aria-label="Historial de cambios">
        <h3 className="vacancy-modal__timeline-title">
          <History size={14} aria-hidden="true" />
          Historial de cambios
        </h3>
        <ol className="vacancy-modal__timeline-list">
          {history.map((h) => (
            <li key={h.id ?? `${h.changed_at}-${h.to_status}`} className="vacancy-modal__timeline-entry">
              <div className="vacancy-modal__timeline-transition">
                {h.from_status ? (
                  <>
                    <span className="vacancy-modal__timeline-status">
                      {VACANCY_STATUS_LABEL[h.from_status]}
                    </span>
                    <ArrowRight size={11} aria-hidden="true" />
                  </>
                ) : null}
                <span className="vacancy-modal__timeline-status vacancy-modal__timeline-status--to">
                  {VACANCY_STATUS_LABEL[h.to_status]}
                </span>
              </div>
              <div className="vacancy-modal__timeline-meta">
                <time dateTime={h.changed_at ?? ''}>
                  {h.changed_at
                    ? new Date(h.changed_at).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: TZ_MX,
                    })
                    : '—'}
                </time>
                {h.changed_by && (
                  <span className="vacancy-modal__timeline-by">· {h.changed_by}</span>
                )}
              </div>
              {h.reason && (
                <div className="vacancy-modal__timeline-reason">{h.reason}</div>
              )}
            </li>
          ))}
        </ol>
      </div>
    ) : null;

  const errorNotice = errorMsg ? (
    <p className="form-error" role="alert">
      {errorMsg}
    </p>
  ) : null;

  const deleteContent = (
    <div className="delete-warning">
      <div className="delete-warning__icon" aria-hidden="true">
        <AlertCircle size={32} />
      </div>
      <p className="delete-warning__title">
        ¿Eliminar vacante de{' '}
        <span className="delete-warning__name">{form.puesto || 'este puesto'}</span>?
      </p>
      <dl className="delete-warning__meta">
        <div className="delete-warning__meta-row">
          <dt>Área</dt>
          <dd>{form.area || '—'}</dd>
        </div>
        <div className="delete-warning__meta-row">
          <dt>Status</dt>
          <dd>{VACANCY_STATUS_LABEL[form.status]}</dd>
        </div>
        <div className="delete-warning__meta-row">
          <dt>Prioridad</dt>
          <dd>{VACANCY_PRIORITY_LABEL[form.prioridad]}</dd>
        </div>
      </dl>
      <p className="delete-warning__sub">
        Se borra el historial de cambios de status asociado.
      </p>
    </div>
  );

  if (isMobile && !isDelete) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={icon}
        title={title}
        subtitle={subtitle}
        className="vacancy-modal modal-fullscreen-mobile modal-wizard-mobile"
      >
        <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
          <FormWizard
            onCancel={onClose}
            submitting={submitting}
            submitDisabled={!isFormValid}
            submitLabel={isAdd ? 'Crear vacante' : 'Guardar cambios'}
            submittingLabel="Guardando…"
            notice={errorNotice}
            steps={[
              {
                id: 'posicion',
                title: 'Posición',
                isValid: form.area.length > 0 && form.puesto.length > 0,
                content: <div className="form-grid">{fieldsPosicion}</div>,
              },
              {
                id: 'seguimiento',
                title: 'Seguimiento',
                content: <div className="form-grid">{fieldsSeguimiento}</div>,
              },
              {
                id: 'detalles',
                title: 'Fechas y detalles',
                content: (
                  <>
                    <div className="form-grid">{fieldsDetalles}</div>
                    {historyBlock}
                  </>
                ),
              },
            ]}
          />
        </form>
      </Modal>
    );
  }

  const footerActions = !isDelete ? (
    <button
      type="submit"
      className="btn-primary"
      disabled={!isFormValid || submitting}
      form="vacancy-form"
    >
      {submitting ? 'Guardando…' : isAdd ? 'Crear vacante' : 'Guardar cambios'}
    </button>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={icon}
      title={title}
      subtitle={subtitle}
      className={`vacancy-modal${!isDelete ? ' vacancy-modal--wide' : ''}`}
      footerActions={footerActions}
      size={isDelete ? 'md' : 'xl'}
    >
      <form id="vacancy-form" onSubmit={handleSubmit} className="modal-body" noValidate>
        {isDelete ? (
          <>
            {deleteContent}
            {errorNotice}
            <footer className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-danger" disabled={submitting}>
                {submitting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="form-grid">
              {fieldsPosicion}
              {fieldsSeguimiento}
              {fieldsDetalles}
            </div>
            {historyBlock}
            {errorNotice}
          </>
        )}
      </form>
    </Modal>
  );
}
