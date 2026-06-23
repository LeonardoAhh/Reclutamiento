import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  diffTransporteAssignments,
  type TransporteDiff,
} from '@/lib/transporte';
import type {
  Employee,
  TransporteAssignment,
  TransporteAssignmentRaw,
} from '@/lib/types';
import './TransporteImporter.css';

interface TransporteImporterProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  /**
   * Aplica las asignaciones en Supabase. Recibe solo las que el diff calificó
   * como `new` o `changed` (nunca `unchanged` ni `missing`). Devuelve un
   * resumen para mostrar al usuario.
   */
  onConfirm: (
    assignments: TransporteAssignment[]
  ) => Promise<{
    ok: boolean;
    updated: number;
    skipped: string[];
    failed: Array<{ num_empleado: string; message: string }>;
  }>;
}

type Stage = 'pick' | 'preview' | 'applying' | 'done' | 'error';

const PREVIEW_LIMIT = 8;

/**
 * Modal de importación de asignaciones de transporte. Flujo:
 *   1. Usuario elige archivo JSON con array de filas `{ Num Empleado, Ruta, Parada }`.
 *   2. Se calcula un diff vs `empleados` y se muestra un preview con
 *      contadores (nuevos / cambios / sin cambio / no encontrados / inválidos).
 *   3. Confirmación aplica solo `new` + `changed`. Si Supabase falla en
 *      registros aislados, se reporta detalle al final.
 */
export function TransporteImporter({
  isOpen,
  onClose,
  employees,
  onConfirm,
}: TransporteImporterProps) {
  const [stage, setStage] = useState<Stage>('pick');
  const [parseError, setParseError] = useState<string | null>(null);
  const [diff, setDiff] = useState<TransporteDiff | null>(null);
  const [applyResult, setApplyResult] = useState<{
    updated: number;
    failed: Array<{ num_empleado: string; message: string }>;
  } | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStage('pick');
      setParseError(null);
      setDiff(null);
      setApplyResult(null);
      setFileName('');
    }
  }, [isOpen]);

  const applicable = useMemo(() => {
    if (!diff) return [] as TransporteAssignment[];
    return diff.entries
      .filter((e) => e.kind === 'new' || e.kind === 'changed')
      .map((e) => e.assignment);
  }, [diff]);

  function handlePickClick() {
    fileRef.current?.click();
  }

  function resetToPick() {
    setStage('pick');
    setParseError(null);
    setDiff(null);
    setApplyResult(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = (ev.target?.result as string) ?? '';
        const json = JSON.parse(text);
        const rows: TransporteAssignmentRaw[] = Array.isArray(json) ? json : [json];
        if (rows.length === 0) {
          setParseError('El archivo está vacío.');
          setStage('error');
          return;
        }
        const result = diffTransporteAssignments(rows, employees);
        setDiff(result);
        setParseError(null);
        setStage('preview');
      } catch (err) {
        setParseError(
          err instanceof Error
            ? `JSON inválido: ${err.message}`
            : 'JSON inválido. Verifica el formato.'
        );
        setStage('error');
      }
    };
    reader.onerror = () => {
      setParseError('No se pudo leer el archivo.');
      setStage('error');
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    if (applicable.length === 0) return;
    setStage('applying');
    const result = await onConfirm(applicable);
    setApplyResult({
      updated: result.updated,
      failed: result.failed,
    });
    setStage('done');
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Importar transporte"
      subtitle="Asigna ruta y parada por número de empleado"
      onClose={onClose}
      className="transporte-importer"
    >
      <div className="transporte-importer__body">
        {/* Hidden file input — driven by the "Elegir archivo" button. */}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          hidden
        />

        {stage === 'pick' && (
          <div className="transporte-importer__pick">
            <p className="transporte-importer__lead">
              Selecciona un archivo JSON con las asignaciones. Estructura
              esperada:
            </p>
            <pre className="transporte-importer__schema">{`[
  {
    "Num Empleado": "12345",
    "Ruta": "Ruta Norte",
    "Parada": "Parada 3"
  }
]`}</pre>
            <button
              type="button"
              className="btn-primary transporte-importer__pick-btn"
              onClick={handlePickClick}
            >
              <Upload size={16} aria-hidden="true" />
              <span>Elegir archivo</span>
            </button>
          </div>
        )}

        {stage === 'preview' && diff && (
          <div className="transporte-importer__preview">
            <header className="transporte-importer__preview-head">
              <span className="transporte-importer__filename">{fileName}</span>
              <button
                type="button"
                className="btn-ghost transporte-importer__change-file"
                onClick={resetToPick}
              >
                <RefreshCcw size={14} aria-hidden="true" />
                <span>Cambiar archivo</span>
              </button>
            </header>

            <ul className="transporte-importer__stats">
              <li className="transporte-importer__stat transporte-importer__stat--applicable">
                <span className="transporte-importer__stat-num">{diff.counts.applicable}</span>
                <span className="transporte-importer__stat-label">A aplicar</span>
              </li>
              <li className="transporte-importer__stat">
                <span className="transporte-importer__stat-num">{diff.counts.new}</span>
                <span className="transporte-importer__stat-label">Nuevos</span>
              </li>
              <li className="transporte-importer__stat">
                <span className="transporte-importer__stat-num">{diff.counts.changed}</span>
                <span className="transporte-importer__stat-label">Cambios</span>
              </li>
              <li className="transporte-importer__stat transporte-importer__stat--muted">
                <span className="transporte-importer__stat-num">{diff.counts.unchanged}</span>
                <span className="transporte-importer__stat-label">Sin cambio</span>
              </li>
              <li className="transporte-importer__stat transporte-importer__stat--warning">
                <span className="transporte-importer__stat-num">{diff.counts.missing}</span>
                <span className="transporte-importer__stat-label">No encontrados</span>
              </li>
              <li className="transporte-importer__stat transporte-importer__stat--error">
                <span className="transporte-importer__stat-num">{diff.counts.invalid}</span>
                <span className="transporte-importer__stat-label">Inválidos</span>
              </li>
            </ul>

            <PreviewTable diff={diff} />

            <footer className="transporte-importer__footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirm}
                disabled={diff.counts.applicable === 0}
              >
                <span>
                  Aplicar {diff.counts.applicable} asignaci
                  {diff.counts.applicable === 1 ? 'ón' : 'ones'}
                </span>
              </button>
            </footer>
          </div>
        )}

        {stage === 'applying' && (
          <div className="transporte-importer__busy">
            <Loader2
              size={24}
              aria-hidden="true"
              className="transporte-importer__spin"
            />
            <p>Aplicando asignaciones en Supabase…</p>
          </div>
        )}

        {stage === 'done' && applyResult && (
          <div className="transporte-importer__done">
            <CheckCircle2
              size={28}
              aria-hidden="true"
              className="transporte-importer__done-icon"
            />
            <p className="transporte-importer__done-msg">
              {applyResult.updated} empleado
              {applyResult.updated === 1 ? '' : 's'} actualizado
              {applyResult.updated === 1 ? '' : 's'}.
            </p>
            {applyResult.failed.length > 0 && (
              <details className="transporte-importer__failed">
                <summary>
                  {applyResult.failed.length} registro
                  {applyResult.failed.length === 1 ? '' : 's'} con error
                </summary>
                <ul>
                  {applyResult.failed.slice(0, PREVIEW_LIMIT).map((f) => (
                    <li key={f.num_empleado}>
                      <code>{f.num_empleado}</code>: {f.message}
                    </li>
                  ))}
                  {applyResult.failed.length > PREVIEW_LIMIT && (
                    <li className="transporte-importer__more">
                      … y {applyResult.failed.length - PREVIEW_LIMIT} más
                    </li>
                  )}
                </ul>
              </details>
            )}
            <footer className="transporte-importer__footer">
              <button type="button" className="btn-secondary" onClick={resetToPick}>
                Cargar otro
              </button>
              <button type="button" className="btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </footer>
          </div>
        )}

        {stage === 'error' && (
          <div className="transporte-importer__error">
            <AlertCircle
              size={24}
              aria-hidden="true"
              className="transporte-importer__error-icon"
            />
            <p>{parseError}</p>
            <button type="button" className="btn-secondary" onClick={resetToPick}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PreviewTable({ diff }: { diff: TransporteDiff }) {
  const visible = diff.entries.slice(0, PREVIEW_LIMIT);
  const overflow = diff.entries.length - visible.length;

  if (diff.entries.length === 0 && diff.invalid.length === 0) {
    return (
      <p className="transporte-importer__empty">
        El archivo no contiene filas legibles.
      </p>
    );
  }

  return (
    <div className="transporte-importer__table-wrap">
      <table className="transporte-importer__table">
        <thead>
          <tr>
            <th scope="col">Num</th>
            <th scope="col">Empleado</th>
            <th scope="col">Ruta · Parada</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entry, idx) => (
            <tr key={`${entry.assignment.num_empleado}-${idx}`}>
              <td className="transporte-importer__td-num">
                {entry.assignment.num_empleado}
              </td>
              <td>{entry.employee?.nombre ?? '—'}</td>
              <td>
                <div>{entry.assignment.ruta}</div>
                <div className="transporte-importer__td-sub">
                  {entry.assignment.parada}
                </div>
                {entry.kind === 'changed' && entry.employee?.ruta && (
                  <div className="transporte-importer__td-old">
                    antes: {entry.employee.ruta} · {entry.employee.parada ?? '—'}
                  </div>
                )}
              </td>
              <td>
                <KindBadge kind={entry.kind} />
              </td>
            </tr>
          ))}
          {diff.invalid.slice(0, Math.max(0, PREVIEW_LIMIT - visible.length)).map(
            (row, idx) => (
              <tr key={`invalid-${idx}`}>
                <td className="transporte-importer__td-num">—</td>
                <td>—</td>
                <td className="transporte-importer__td-old">
                  {row.error ?? 'Fila inválida'}
                </td>
                <td>
                  <KindBadge kind="invalid" />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {overflow > 0 && (
        <p className="transporte-importer__more">
          … y {overflow} fila{overflow === 1 ? '' : 's'} más
        </p>
      )}
    </div>
  );
}

type BadgeKind = 'new' | 'changed' | 'unchanged' | 'missing' | 'invalid';

function KindBadge({ kind }: { kind: BadgeKind }) {
  const label: Record<BadgeKind, string> = {
    new: 'Nuevo',
    changed: 'Cambio',
    unchanged: 'Sin cambio',
    missing: 'No existe',
    invalid: 'Inválido',
  };
  return (
    <span className={`transporte-importer__badge transporte-importer__badge--${kind}`}>
      {label[kind]}
    </span>
  );
}
