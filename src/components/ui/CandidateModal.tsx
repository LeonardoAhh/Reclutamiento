import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import { Modal } from './Modal';
import './CandidateModal.css';

type Mode = 'add' | 'edit' | 'delete';

interface CandidateModalProps {
  isOpen: boolean;
  mode: Mode;
  candidate?: Candidate | null;
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
  notas: string;
}

function emptyForm(): FormState {
  return {
    nombre: '',
    telefono: '',
    email: '',
    puesto: '',
    area: '',
    seccion: '',
    status: 'aplico',
    reclutador: '',
    source: '',
    cv_url: '',
    fecha_aplicacion: new Date().toISOString().slice(0, 10),
    notas: '',
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
    fecha_aplicacion: (c.fecha_aplicacion ?? new Date().toISOString()).slice(0, 10),
    notas: c.notas ?? '',
  };
}

export function CandidateModal({
  isOpen,
  mode,
  candidate,
  onClose,
  onSave,
  onDelete,
}: CandidateModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setForm(candidate ? fromCandidate(candidate) : emptyForm());
  }, [isOpen, candidate, mode]);

  const isFormValid =
    form.nombre.trim().length > 0 &&
    form.area.length > 0 &&
    form.puesto.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);

      if (mode === 'delete' && onDelete && candidate?.id) {
        const result = await onDelete(candidate.id);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? 'No se pudo eliminar.');
          return;
        }
        onClose();
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
          fecha_aplicacion: new Date(form.fecha_aplicacion).toISOString(),
          notas: form.notas.trim() || null,
        };
        const result = await onSave(payload, candidate?.id);
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
    <UserPlus size={20} className="color-primary" aria-hidden="true" />
  );

  const title = isDelete
    ? 'Eliminar candidato'
    : isEdit
    ? 'Editar candidato'
    : 'Nuevo candidato';

  const subtitle = isDelete
    ? 'Acción irreversible'
    : isEdit
    ? 'Actualizar datos del pipeline'
    : 'Registrar en el pipeline';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidate-modal"
      icon={icon}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        {isDelete ? (
          <div className="delete-warning">
            <div className="delete-warning__icon" aria-hidden="true">
              <AlertCircle size={32} />
            </div>
            <p className="delete-warning__title">
              ¿Eliminar a{' '}
              <span className="delete-warning__name">{form.nombre || 'este candidato'}</span>?
            </p>
            <dl className="delete-warning__meta">
              <div className="delete-warning__meta-row">
                <dt>Puesto</dt>
                <dd>{form.puesto || '—'}</dd>
              </div>
              <div className="delete-warning__meta-row">
                <dt>Área</dt>
                <dd>{form.area || '—'}</dd>
              </div>
              <div className="delete-warning__meta-row">
                <dt>Estado</dt>
                <dd>{CANDIDATE_STATUS_LABEL[form.status]}</dd>
              </div>
            </dl>
            <p className="delete-warning__sub">
              Esta acción no se puede deshacer. Las notas asociadas también se eliminan.
            </p>
          </div>
        ) : (
          <div className="form-grid">
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
                placeholder="442 123 4567"
                autoComplete="off"
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="cand-area">Área</label>
              <select
                id="cand-area"
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
              <label htmlFor="cand-seccion">Sección</label>
              <select
                id="cand-seccion"
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
            <div className="form-group form-group--span-2">
              <label htmlFor="cand-puesto">Puesto</label>
              <select
                id="cand-puesto"
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
              <label htmlFor="cand-status">Estado</label>
              <select
                id="cand-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as CandidateStatus })
                }
              >
                {CANDIDATE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CANDIDATE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cand-reclutador">Reclutador</label>
              <input
                id="cand-reclutador"
                type="text"
                value={form.reclutador}
                onChange={(e) => setForm({ ...form, reclutador: e.target.value })}
                placeholder="Quién lo está moviendo"
                autoComplete="off"
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
              />
              <datalist id="cand-source-suggestions">
                <option value="LinkedIn" />
                <option value="Indeed" />
                <option value="OCC" />
                <option value="Referido" />
                <option value="Walk-in" />
                <option value="Facebook" />
                <option value="Bolsa de trabajo" />
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="cand-fecha">Fecha de aplicación</label>
              <input
                id="cand-fecha"
                type="date"
                value={form.fecha_aplicacion}
                onChange={(e) => setForm({ ...form, fecha_aplicacion: e.target.value })}
              />
            </div>
            <div className="form-group form-group--span-2">
              <label htmlFor="cand-cv">URL del CV</label>
              <input
                id="cand-cv"
                type="url"
                value={form.cv_url}
                onChange={(e) => setForm({ ...form, cv_url: e.target.value })}
                placeholder="https://drive.google.com/…"
                autoComplete="off"
              />
            </div>
            <div className="form-group form-group--span-2">
              <label htmlFor="cand-notas">Notas rápidas</label>
              <textarea
                id="cand-notas"
                rows={3}
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Resumen corto. Las notas largas van en el panel del candidato."
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="form-error" role="alert">{errorMsg}</p>
        )}

        <footer className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          {isDelete ? (
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Eliminando…' : 'Eliminar'}
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              disabled={!isFormValid || submitting}
            >
              {submitting ? 'Guardando…' : isAdd ? 'Guardar candidato' : 'Guardar cambios'}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}
