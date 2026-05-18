import { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, Plus, ListChecks } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { usePositions, type CreatePositionResult } from '@/lib/positions';
import { Modal } from './Modal';
import './PromoteEmployeeModal.css';

type PromoteMode = 'existing' | 'new';

interface ExistingForm {
  area: string;
  seccion: string;
  puesto: string;
}

interface NewForm {
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada: number;
  notas: string;
}

interface PromoteEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onPromote: (
    employee: Employee,
    target: { area: string; seccion: string; puesto: string }
  ) => Promise<{ ok: boolean; message?: string }>;
  onCreatePosition: (input: {
    area: string;
    seccion: string;
    puesto: string;
    plantilla_autorizada?: number;
    notas?: string | null;
  }) => Promise<CreatePositionResult>;
}

function emptyExisting(): ExistingForm {
  return { area: '', seccion: '', puesto: '' };
}

function emptyNew(employee: Employee | null): NewForm {
  return {
    area: employee?.area ?? '',
    seccion: employee?.seccion ?? '',
    puesto: '',
    plantilla_autorizada: 1,
    notas: '',
  };
}

/**
 * Modal de promoción de empleado.
 *
 * Dos rutas:
 *  - **existing**: el usuario elige área → sección → puesto entre los puestos
 *    ya autorizados (`PLANTILLA_AUTORIZADA` estática + `custom_positions`).
 *  - **new**: el usuario captura un puesto totalmente nuevo. Antes de
 *    promover, lo persiste como `custom_position` para que aparezca en todos
 *    los selectores del sistema (Dashboard, Vacantes, Pipeline, modales).
 */
export function PromoteEmployeeModal({
  isOpen,
  employee,
  onClose,
  onPromote,
  onCreatePosition,
}: PromoteEmployeeModalProps) {
  const { positions } = usePositions();
  const [mode, setMode] = useState<PromoteMode>('existing');
  const [existing, setExisting] = useState<ExistingForm>(() => emptyExisting());
  const [draft, setDraft] = useState<NewForm>(() => emptyNew(employee));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode('existing');
    setExisting(emptyExisting());
    setDraft(emptyNew(employee));
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, employee]);

  const areas = useMemo(
    () => Array.from(new Set(positions.map((p) => p.area))).sort((a, b) =>
      a.localeCompare(b, 'es')
    ),
    [positions]
  );

  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          positions.filter((p) => p.area === existing.area).map((p) => p.seccion)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [positions, existing.area]
  );

  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          positions
            .filter(
              (p) => p.area === existing.area && p.seccion === existing.seccion
            )
            .map((p) => p.puesto)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [positions, existing.area, existing.seccion]
  );

  const allAreas = useMemo(
    () => Array.from(new Set(positions.map((p) => p.area))).sort((a, b) =>
      a.localeCompare(b, 'es')
    ),
    [positions]
  );

  const isExistingValid =
    existing.area.length > 0 &&
    existing.seccion.length > 0 &&
    existing.puesto.length > 0 &&
    !(
      employee &&
      employee.area === existing.area &&
      employee.seccion === existing.seccion &&
      employee.puesto === existing.puesto
    );

  const isNewValid =
    draft.area.trim().length > 0 &&
    draft.seccion.trim().length > 0 &&
    draft.puesto.trim().length > 0 &&
    Number.isFinite(draft.plantilla_autorizada) &&
    draft.plantilla_autorizada >= 0;

  const canSubmit = mode === 'existing' ? isExistingValid : isNewValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee || submitting || !canSubmit) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);

      let target: { area: string; seccion: string; puesto: string };
      if (mode === 'existing') {
        target = {
          area: existing.area,
          seccion: existing.seccion,
          puesto: existing.puesto,
        };
      } else {
        const created = await onCreatePosition({
          area: draft.area.trim(),
          seccion: draft.seccion.trim(),
          puesto: draft.puesto.trim().toUpperCase(),
          plantilla_autorizada: draft.plantilla_autorizada,
          notas: draft.notas.trim() ? draft.notas.trim() : null,
        });
        if (!created.ok || !created.position) {
          setErrorMsg(created.message ?? 'No se pudo crear el puesto.');
          return;
        }
        target = {
          area: created.position.area,
          seccion: created.position.seccion,
          puesto: created.position.puesto,
        };
      }

      const result = await onPromote(employee, target);
      if (!result.ok) {
        setErrorMsg(result.message ?? 'No se pudo promover.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen || !employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="promote-modal"
      icon={<ArrowUpCircle size={20} className="color-primary" aria-hidden="true" />}
      title="Promover empleado"
      subtitle={`#${employee.num_empleado} · ${employee.nombre}`}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        <section className="promote-current" aria-label="Puesto actual">
          <span className="promote-current__label">Puesto actual</span>
          <p className="promote-current__puesto">{employee.puesto}</p>
          <p className="promote-current__meta">
            {employee.area} · {employee.seccion}
          </p>
        </section>

        <div
          className="promote-mode"
          role="radiogroup"
          aria-label="Tipo de promoción"
        >
          <button
            type="button"
            className={`promote-mode__option${mode === 'existing' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={mode === 'existing'}
            onClick={() => setMode('existing')}
          >
            <ListChecks size={16} aria-hidden="true" />
            <span>Puesto existente</span>
          </button>
          <button
            type="button"
            className={`promote-mode__option${mode === 'new' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={mode === 'new'}
            onClick={() => setMode('new')}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Crear nuevo puesto</span>
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="promote-existing-area">Área</label>
              <select
                id="promote-existing-area"
                required
                value={existing.area}
                onChange={(e) =>
                  setExisting({
                    area: e.target.value,
                    seccion: '',
                    puesto: '',
                  })
                }
              >
                <option value="">Seleccione área…</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="promote-existing-seccion">Sección</label>
              <select
                id="promote-existing-seccion"
                required
                value={existing.seccion}
                onChange={(e) =>
                  setExisting({ ...existing, seccion: e.target.value, puesto: '' })
                }
                disabled={!existing.area}
              >
                <option value="">Seleccione sección…</option>
                {sectionsForArea.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="promote-existing-puesto">Nuevo puesto</label>
              <select
                id="promote-existing-puesto"
                required
                value={existing.puesto}
                onChange={(e) =>
                  setExisting({ ...existing, puesto: e.target.value })
                }
                disabled={!existing.seccion}
              >
                <option value="">Seleccione puesto…</option>
                {puestosForSection.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="promote-new-area">Área</label>
              <input
                id="promote-new-area"
                type="text"
                required
                value={draft.area}
                onChange={(e) =>
                  setDraft({ ...draft, area: e.target.value.toUpperCase() })
                }
                placeholder="Ej. RECURSOS HUMANOS"
                autoComplete="off"
                list="promote-area-suggestions"
              />
              <datalist id="promote-area-suggestions">
                {allAreas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="promote-new-seccion">Sección</label>
              <input
                id="promote-new-seccion"
                type="text"
                required
                value={draft.seccion}
                onChange={(e) =>
                  setDraft({ ...draft, seccion: e.target.value.toUpperCase() })
                }
                placeholder="Ej. RECURSOS HUMANOS"
                autoComplete="off"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="promote-new-puesto">Nombre del puesto</label>
              <input
                id="promote-new-puesto"
                type="text"
                required
                value={draft.puesto}
                onChange={(e) =>
                  setDraft({ ...draft, puesto: e.target.value.toUpperCase() })
                }
                placeholder="Ej. COORDINADOR DE NUEVO PROCESO"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="promote-new-plantilla">Plantilla autorizada</label>
              <input
                id="promote-new-plantilla"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={draft.plantilla_autorizada}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    plantilla_autorizada: Math.max(
                      0,
                      Number.parseInt(e.target.value, 10) || 0
                    ),
                  })
                }
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="promote-new-notas">Notas (opcional)</label>
              <input
                id="promote-new-notas"
                type="text"
                value={draft.notas}
                onChange={(e) => setDraft({ ...draft, notas: e.target.value })}
                placeholder="Ej. Promoción por reestructura"
                autoComplete="off"
              />
            </div>
            <p className="promote-hint" style={{ gridColumn: '1 / -1' }}>
              El puesto se registrará y aparecerá automáticamente en los
              selectores de Dashboard, Vacantes, Pipeline y formularios
              relacionados.
            </p>
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
          <button
            type="submit"
            className="btn-primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Promoviendo…' : 'Confirmar promoción'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
