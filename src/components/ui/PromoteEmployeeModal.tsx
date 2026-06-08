import { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, ListChecks, Plus } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { usePositions, type CreatePositionResult } from '@/lib/positions';
import { Modal } from './Modal';
import './PromoteEmployeeModal.css';

/* ── Tipos ────────────────────────────────────────────────────────────────── */

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
    target: { area: string; seccion: string; puesto: string },
  ) => Promise<{ ok: boolean; message?: string }>;
  onCreatePosition: (input: {
    area: string;
    seccion: string;
    puesto: string;
    plantilla_autorizada?: number;
    notas?: string | null;
  }) => Promise<CreatePositionResult>;
}

/* ── Estado inicial ───────────────────────────────────────────────────────── */

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

/* ── Componente ───────────────────────────────────────────────────────────── */

/**
 * Modal de promoción de empleado.
 *
 * Dos rutas:
 *  - **existing**: selección encadenada área → sección → puesto
 *    entre los puestos ya autorizados.
 *  - **new**: captura de un puesto nuevo que se persiste como
 *    `custom_position` antes de ejecutar la promoción.
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
  const [existing, setExisting] = useState<ExistingForm>(emptyExisting);
  const [draft, setDraft] = useState<NewForm>(() => emptyNew(employee));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* Resetear estado cada vez que el modal se abre */
  useEffect(() => {
    if (!isOpen) return;
    setMode('existing');
    setExisting(emptyExisting());
    setDraft(emptyNew(employee));
    setErrorMsg(null);
    setSubmitting(false);
  }, [isOpen, employee]);

  /* ── Listas derivadas ─────────────────────────────────────────────────── */

  const areas = useMemo(
    () =>
      Array.from(new Set(positions.map((p) => p.area))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [positions],
  );

  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          positions
            .filter((p) => p.area === existing.area)
            .map((p) => p.seccion),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [positions, existing.area],
  );

  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          positions
            .filter(
              (p) =>
                p.area === existing.area && p.seccion === existing.seccion,
            )
            .map((p) => p.puesto),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [positions, existing.area, existing.seccion],
  );

  /* ── Validación ───────────────────────────────────────────────────────── */

  const isSamePosition =
    !!employee &&
    employee.area === existing.area &&
    employee.seccion === existing.seccion &&
    employee.puesto === existing.puesto;

  const isExistingValid =
    existing.area.length > 0 &&
    existing.seccion.length > 0 &&
    existing.puesto.length > 0 &&
    !isSamePosition;

  const isNewValid =
    draft.area.trim().length > 0 &&
    draft.seccion.trim().length > 0 &&
    draft.puesto.trim().length > 0 &&
    Number.isFinite(draft.plantilla_autorizada) &&
    draft.plantilla_autorizada >= 0;

  const canSubmit = mode === 'existing' ? isExistingValid : isNewValid;

  /* ── Submit ───────────────────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee || submitting || !canSubmit) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
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
          notas: draft.notas.trim() || null,
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
        setErrorMsg(result.message ?? 'No se pudo promover al empleado.');
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Handlers de campo ────────────────────────────────────────────────── */

  function handleExistingArea(e: React.ChangeEvent<HTMLSelectElement>) {
    setExisting({ area: e.target.value, seccion: '', puesto: '' });
  }

  function handleExistingSeccion(e: React.ChangeEvent<HTMLSelectElement>) {
    setExisting((prev) => ({ ...prev, seccion: e.target.value, puesto: '' }));
  }

  function handleExistingPuesto(e: React.ChangeEvent<HTMLSelectElement>) {
    setExisting((prev) => ({ ...prev, puesto: e.target.value }));
  }

  function handleDraftField(
    field: keyof NewForm,
    value: string | number,
  ) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  /* ── Render guard ─────────────────────────────────────────────────────── */

  if (!isOpen || !employee) return null;

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="promote-modal"
      icon={
        <ArrowUpCircle
          size={18}
          className="color-primary"
          aria-hidden="true"
        />
      }
      title="Promover empleado"
      subtitle={`#${employee.num_empleado} · ${employee.nombre}`}
    >
      <form
        id="promote-form"
        onSubmit={handleSubmit}
        className="modal-body"
        noValidate
        aria-label={`Formulario de promoción — ${employee.nombre}`}
      >
        {/* ── Puesto actual ──────────────────────────────────────────── */}
        <section
          className="promote-current"
          aria-label="Puesto actual del empleado"
        >
          <span className="promote-current__label">Puesto actual</span>
          <p className="promote-current__puesto">{employee.puesto}</p>
          <p className="promote-current__meta">
            {employee.area} · {employee.seccion}
          </p>
        </section>

        {/* ── Segmented control de modo ──────────────────────────────── */}
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
            <ListChecks size={15} aria-hidden="true" />
            <span>Puesto existente</span>
          </button>
          <button
            type="button"
            className={`promote-mode__option${mode === 'new' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={mode === 'new'}
            onClick={() => setMode('new')}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Crear nuevo puesto</span>
          </button>
        </div>

        {/* ── Campos según modo ──────────────────────────────────────── */}
        {mode === 'existing' ? (
          <ExistingFields
            existing={existing}
            areas={areas}
            sections={sectionsForArea}
            puestos={puestosForSection}
            onArea={handleExistingArea}
            onSeccion={handleExistingSeccion}
            onPuesto={handleExistingPuesto}
            isSamePosition={isSamePosition}
          />
        ) : (
          <NewPositionFields
            draft={draft}
            allAreas={areas}
            onChange={handleDraftField}
          />
        )}

        {/* ── Error global ───────────────────────────────────────────── */}
        {errorMsg && (
          <p className="form-error" role="alert">
            {errorMsg}
          </p>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
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
            aria-busy={submitting}
          >
            {submitting ? 'Promoviendo…' : 'Confirmar promoción'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

/* ============================================================
   Sub-componente: campos para puesto existente
   ============================================================ */

interface ExistingFieldsProps {
  existing: ExistingForm;
  areas: string[];
  sections: string[];
  puestos: string[];
  onArea: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSeccion: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPuesto: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isSamePosition: boolean;
}

function ExistingFields({
  existing,
  areas,
  sections,
  puestos,
  onArea,
  onSeccion,
  onPuesto,
  isSamePosition,
}: ExistingFieldsProps) {
  return (
    <div className="form-grid" role="group" aria-label="Selección de puesto destino">
      {/* Área */}
      <div className="form-group">
        <label htmlFor="promote-existing-area">Área</label>
        <select
          id="promote-existing-area"
          required
          value={existing.area}
          onChange={onArea}
          aria-describedby={
            existing.area === '' ? 'promote-existing-area-hint' : undefined
          }
        >
          <option value="">Seleccione área…</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {existing.area === '' && (
          <span id="promote-existing-area-hint" className="sr-only">
            Seleccione un área para ver las secciones disponibles.
          </span>
        )}
      </div>

      {/* Sección */}
      <div className="form-group">
        <label htmlFor="promote-existing-seccion">Sección</label>
        <select
          id="promote-existing-seccion"
          required
          value={existing.seccion}
          onChange={onSeccion}
          disabled={!existing.area}
          aria-disabled={!existing.area}
          aria-describedby={
            !existing.area ? 'promote-existing-seccion-hint' : undefined
          }
        >
          <option value="">Seleccione sección…</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {!existing.area && (
          <span id="promote-existing-seccion-hint" className="sr-only">
            Primero seleccione un área.
          </span>
        )}
      </div>

      {/* Puesto */}
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="promote-existing-puesto">Nuevo puesto</label>
        <select
          id="promote-existing-puesto"
          required
          value={existing.puesto}
          onChange={onPuesto}
          disabled={!existing.seccion}
          aria-disabled={!existing.seccion}
          aria-invalid={isSamePosition || undefined}
          aria-describedby={
            isSamePosition ? 'promote-same-position-error' : undefined
          }
        >
          <option value="">Seleccione puesto…</option>
          {puestos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {isSamePosition && (
          <span
            id="promote-same-position-error"
            className="form-error"
            role="alert"
          >
            El empleado ya ocupa este puesto.
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Sub-componente: campos para crear nuevo puesto
   ============================================================ */

interface NewPositionFieldsProps {
  draft: NewForm;
  allAreas: string[];
  onChange: (field: keyof NewForm, value: string | number) => void;
}

function NewPositionFields({ draft, allAreas, onChange }: NewPositionFieldsProps) {
  return (
    <div className="form-grid" role="group" aria-label="Datos del nuevo puesto">
      {/* Área */}
      <div className="form-group">
        <label htmlFor="promote-new-area">Área</label>
        <input
          id="promote-new-area"
          type="text"
          required
          value={draft.area}
          onChange={(e) =>
            onChange('area', e.target.value.toUpperCase())
          }
          placeholder="Ej. RECURSOS HUMANOS"
          autoComplete="off"
          list="promote-area-suggestions"
          aria-autocomplete="list"
        />
        <datalist id="promote-area-suggestions">
          {allAreas.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>

      {/* Sección */}
      <div className="form-group">
        <label htmlFor="promote-new-seccion">Sección</label>
        <input
          id="promote-new-seccion"
          type="text"
          required
          value={draft.seccion}
          onChange={(e) =>
            onChange('seccion', e.target.value.toUpperCase())
          }
          placeholder="Ej. DESARROLLO ORGANIZACIONAL"
          autoComplete="off"
        />
      </div>

      {/* Nombre del puesto */}
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="promote-new-puesto">Nombre del puesto</label>
        <input
          id="promote-new-puesto"
          type="text"
          required
          value={draft.puesto}
          onChange={(e) =>
            onChange('puesto', e.target.value.toUpperCase())
          }
          placeholder="Ej. COORDINADOR DE NUEVO PROCESO"
          autoComplete="off"
        />
      </div>

      {/* Plantilla autorizada */}
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
            onChange(
              'plantilla_autorizada',
              Math.max(0, parseInt(e.target.value, 10) || 0),
            )
          }
          aria-describedby="promote-plantilla-hint"
        />
        <span id="promote-plantilla-hint" className="sr-only">
          Número de plazas autorizadas para este puesto. Mínimo 0.
        </span>
      </div>

      {/* Notas */}
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="promote-new-notas">
          Notas{' '}
          <span aria-hidden="true" style={{ fontWeight: 400, textTransform: 'none', fontSize: 'var(--type-caption-md-size)', color: 'var(--color-muted-soft)', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <input
          id="promote-new-notas"
          type="text"
          value={draft.notas}
          onChange={(e) => onChange('notas', e.target.value)}
          placeholder="Ej. Promoción por reestructura organizacional"
          autoComplete="off"
        />
      </div>

      {/* Hint informativo */}
      <p className="promote-hint" style={{ gridColumn: '1 / -1' }}>
        El puesto se registrará en el sistema y aparecerá en los selectores
        de Dashboard, Vacantes, Pipeline y formularios relacionados.
      </p>
    </div>
  );
}
