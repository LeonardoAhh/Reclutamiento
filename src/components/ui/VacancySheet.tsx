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
  VacancyStatusHistoryEntry,
} from '@/lib/types';
import {
  VACANCY_STATUSES,
  VACANCY_STATUS_LABEL,
  VACANCY_PRIORITIES,
  VACANCY_PRIORITY_LABEL,
  VACANCY_EXCLUSION_REASONS,
  DEFAULT_VACANCY_SLA_DAYS,
} from '@/lib/types';
import { usePositions } from '@/lib/positions';
import {
  localTodayIso,
  localDateToIso,
  isoToLocalDateString,
  addBusinessDays,
  TZ_MX,
} from '@/lib/dates';
import { Sheet } from './Sheet';
import { Modal } from './Modal';
import { FormWizard } from './FormWizard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CANDIDATE_SOURCES } from '@/lib/types';

type Mode = 'add' | 'edit' | 'delete';

interface VacancySheetProps {
  isOpen: boolean;
  mode: Mode;
  vacancy?: VacancyRequest | null;
  /** Historial de cambios de status, más reciente primero. */
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
  reclutador_asignado: string;
  fuente_planeada: string;
  fecha_apertura: string;
  fecha_objetivo: string;
  fecha_cubierta: string;
  justificacion: string;
  dias_sla: number;
  excluida_indicador: boolean;
  motivo_exclusion: string;
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
    reclutador_asignado: '',
    fuente_planeada: '',
    fecha_apertura: todayIso(),
    fecha_objetivo: '',
    fecha_cubierta: '',
    justificacion: '',
    dias_sla: DEFAULT_VACANCY_SLA_DAYS,
    excluida_indicador: false,
    motivo_exclusion: '',
  };
}

function fromVacancy(v: VacancyRequest): FormState {
  return {
    area: v.area ?? '',
    seccion: v.seccion ?? '',
    puesto: v.puesto ?? '',
    status: v.status,
    prioridad: v.prioridad,
    reclutador_asignado: v.reclutador_asignado ?? '',
    fuente_planeada: v.fuente_planeada ?? '',
    fecha_apertura: v.fecha_apertura
      ? isoToLocalDateString(v.fecha_apertura)
      : localTodayIso(),
    fecha_objetivo: isoToLocalDateString(v.fecha_objetivo),
    fecha_cubierta: isoToLocalDateString(v.fecha_cubierta),
    justificacion: v.justificacion ?? '',
    dias_sla: DEFAULT_VACANCY_SLA_DAYS, // Siempre usar el SLA por defecto (12 días hábiles)
    excluida_indicador: !!v.excluida_indicador,
    motivo_exclusion: v.motivo_exclusion ?? '',
  };
}

export function VacancySheet({
  isOpen,
  mode,
  vacancy,
  history,
  onClose,
  onSave,
  onDelete,
}: VacancySheetProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const useModal = !isMobile;

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

  // Calcular fecha objetivo automáticamente cuando cambia la fecha de apertura
  useEffect(() => {
    if (form.fecha_apertura && form.dias_sla > 0) {
      const fechaObjetivo = addBusinessDays(form.fecha_apertura, form.dias_sla);
      if (fechaObjetivo && fechaObjetivo !== form.fecha_objetivo) {
        setForm((prev) => ({ ...prev, fecha_objetivo: fechaObjetivo }));
      }
    }
  }, [form.fecha_apertura, form.dias_sla]);

  const isFormValid =
    form.area.length > 0 && form.puesto.length > 0 && form.status.length > 0;

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

        // Si cambia a 'cubierta' y no hay fecha capturada, fijamos hoy.
        // Si sale de 'cubierta', limpiamos la fecha.
        let fechaCubierta: string | null = null;
        if (form.status === 'cubierta') {
          fechaCubierta =
            localDateToIso(form.fecha_cubierta) ?? new Date().toISOString();
        }

        const payload: Omit<VacancyRequest, 'id' | 'created_at' | 'updated_at'> = {
          area: form.area,
          seccion: form.seccion || null,
          puesto: form.puesto,
          status: form.status,
          prioridad: form.prioridad,
          reclutador_asignado: form.reclutador_asignado.trim() || null,
          fuente_planeada: form.fuente_planeada.trim() || null,
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

  /* ── Campos agrupados para componer ambos layouts ────────────────────
     PC: un solo form-grid (diseño actual). Móvil: wizard de 3 pasos. */

  const fieldsPosicion = (
    <>
      <div className="form-group">
        <label htmlFor="vac-area">Área *</label>
        <select
          id="vac-area"
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
        <label htmlFor="vac-seccion">Sección</label>
        <select
          id="vac-seccion"
          value={form.seccion}
          onChange={(e) => setForm({ ...form, seccion: e.target.value, puesto: '' })}
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
      <div className="form-group form-group--span-2">
        <label htmlFor="vac-puesto">Puesto *</label>
        <select
          id="vac-puesto"
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
    </>
  );

  const fieldsSeguimiento = (
    <>
      <div className="form-group">
        <label htmlFor="vac-status">Status</label>
        <select
          id="vac-status"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as VacancyStatus })
          }
        >
          {VACANCY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {VACANCY_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="vac-prioridad">Prioridad</label>
        <select
          id="vac-prioridad"
          value={form.prioridad}
          onChange={(e) =>
            setForm({ ...form, prioridad: e.target.value as VacancyPriority })
          }
        >
          {VACANCY_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {VACANCY_PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="vac-reclutador">Reclutador asignado</label>
        <input
          id="vac-reclutador"
          type="text"
          value={form.reclutador_asignado}
          onChange={(e) =>
            setForm({ ...form, reclutador_asignado: e.target.value })
          }
          placeholder="Quién la lleva"
          autoComplete="off"
        />
      </div>
      <div className="form-group">
        <label htmlFor="vac-fuente">Fuente planeada</label>
        <input
          id="vac-fuente"
          type="text"
          value={form.fuente_planeada}
          onChange={(e) => setForm({ ...form, fuente_planeada: e.target.value })}
          placeholder="LinkedIn · Bolsa · Referidos…"
          autoComplete="off"
          list="vac-fuente-suggestions"
        />
        <datalist id="vac-fuente-suggestions">
          {CANDIDATE_SOURCES.map((s) => <option key={s} value={s} />)}
        </datalist>
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

      <div className="form-group form-group--span-2 vac-exclusion">
        <label className="vac-exclusion__toggle">
          <input
            type="checkbox"
            checked={form.excluida_indicador}
            onChange={(e) =>
              setForm({ ...form, excluida_indicador: e.target.checked })
            }
          />
          <span>
            <strong>Excluir del indicador</strong>{' '}
          </span>
        </label>
        {form.excluida_indicador && (
          <div className="vac-exclusion__reason">
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
      <div className="vac-timeline" aria-label="Historial de cambios">
        <h3 className="vac-timeline__title">
          <History size={14} aria-hidden="true" />
          Historial de cambios
        </h3>
        <ol className="vac-timeline__list">
          {history.map((h) => (
            <li key={h.id ?? `${h.changed_at}-${h.to_status}`} className="vac-timeline__entry">
              <div className="vac-timeline__transition">
                {h.from_status ? (
                  <>
                    <span className="vac-timeline__status">
                      {VACANCY_STATUS_LABEL[h.from_status]}
                    </span>
                    <ArrowRight size={11} aria-hidden="true" />
                  </>
                ) : null}
                <span className="vac-timeline__status vac-timeline__status--to">
                  {VACANCY_STATUS_LABEL[h.to_status]}
                </span>
              </div>
              <div className="vac-timeline__meta">
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
                  <span className="vac-timeline__by">· {h.changed_by}</span>
                )}
              </div>
              {h.reason && (
                <div className="vac-timeline__reason">{h.reason}</div>
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

  if (useModal) {
    /* ── PC: modal centrado (diseño actual, sin cambios) ── */
    const headerActions = (
      <>
        {isDelete ? (
          <button type="submit" className="btn-danger" disabled={submitting} form="vacancy-form">
            {submitting ? 'Eliminando…' : 'Eliminar'}
          </button>
        ) : (
          <button
            type="submit"
            className="btn-primary"
            disabled={!isFormValid || submitting}
            form="vacancy-form"
          >
            {submitting ? 'Guardando…' : isAdd ? 'Crear vacante' : 'Guardar cambios'}
          </button>
        )}
      </>
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={icon}
        title={title}
        subtitle={subtitle}
        className={`vacancy-sheet${!isDelete ? ' vacancy-sheet--wide' : ''}`}
        headerActions={headerActions}
      >
        <form id="vacancy-form" onSubmit={handleSubmit} className="vacancy-sheet__form" noValidate>
          <div className="modal-body">
            {isDelete ? (
              deleteContent
            ) : (
              <div className="form-grid">
                {fieldsPosicion}
                {fieldsSeguimiento}
                {fieldsDetalles}
              </div>
            )}
            {historyBlock}
            {errorNotice}
          </div>
        </form>
      </Modal>
    );
  }

  /* ── Móvil: bottom sheet ── */
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="vacancy-sheet"
      side="right"
      width={isDelete ? 'sm' : 'md'}
      icon={icon}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={handleSubmit} className="vacancy-sheet__form" noValidate>
        {isDelete ? (
          <>
            <div className="sheet__body">
              {deleteContent}
              {errorNotice}
            </div>
            <footer className="sheet__footer">
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
          /* Alta/edición por pasos en móvil */
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
        )}
      </form>
    </Sheet>
  );
}
