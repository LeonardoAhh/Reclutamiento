import { useRef, useState, type ChangeEvent } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/lib/notify';
import type { Employee, EmployeeAssignmentUpdate } from '@/lib/types';
import {
  buildEmployeeAssignmentPreview,
  parseEmployeeAssignmentJson,
  type EmployeeAssignmentPreview,
} from './model';
import './EmployeeBulkUpdateModal.css';

const EMPLOYEE_BULK_UPDATE_TRIGGER_VISIBLE = false;

interface EmployeeBulkUpdateModalProps {
  employees: Employee[];
  onApply: (updates: EmployeeAssignmentUpdate[]) => Promise<{
    ok: boolean;
    updated: number;
    message?: string;
  }>;
}

function FieldChange({ current, next }: { current: string; next: string }) {
  const changed = current.trim() !== next;
  return (
    <span className="employee-bulk-update__change">
      <span>{current || '—'}</span>
      {changed ? (
        <>
          <ArrowRight aria-label="cambia a" />
          <strong>{next}</strong>
        </>
      ) : (
        <span className="employee-bulk-update__unchanged">Sin cambio</span>
      )}
    </span>
  );
}

export function EmployeeBulkUpdateModal({
  employees,
  onApply,
}: EmployeeBulkUpdateModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<EmployeeAssignmentPreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);

  function close() {
    if (applying) return;
    setIsOpen(false);
    setPreview(null);
    setErrors([]);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setErrors([]);
    setPreview(null);
    setIsOpen(true);

    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const parsed = parseEmployeeAssignmentJson(parsedJson);
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return;
      }
      setPreview(buildEmployeeAssignmentPreview(employees, parsed.updates));
    } catch {
      setErrors(['No se pudo leer el JSON. Verifica que el archivo tenga un formato válido.']);
    }
  }

  async function apply() {
    if (!preview || preview.changes.length === 0 || applying) return;
    setApplying(true);
    setErrors([]);
    try {
      const result = await onApply(preview.changes.map(({ update }) => update));
      if (!result.ok) {
        setErrors([result.message ?? 'No se pudieron aplicar las actualizaciones.']);
        return;
      }

      toast.success({ title: `${result.updated} empleado${result.updated === 1 ? '' : 's'} actualizado${result.updated === 1 ? '' : 's'}` });
      setIsOpen(false);
      setPreview(null);
    } catch {
      setErrors(['No se pudieron aplicar las actualizaciones. Intenta de nuevo.']);
    } finally {
      setApplying(false);
    }
  }

  const changeCount = preview?.changes.length ?? 0;

  return (
    <>
      {EMPLOYEE_BULK_UPDATE_TRIGGER_VISIBLE && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleFile(event)}
            hidden
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden="true" />
            Actualizar asignaciones
          </button>
        </>
      )}

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Vista previa de actualización"
        icon={<Upload aria-hidden="true" />}
        size="xl"
        className="employee-bulk-update"
        footerActions={
          <>
            <button type="button" className="btn-secondary" onClick={close} disabled={applying}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void apply()}
              disabled={applying || changeCount === 0 || errors.length > 0}
              aria-busy={applying}
            >
              {applying ? 'Actualizando…' : `Aplicar ${changeCount} cambio${changeCount === 1 ? '' : 's'}`}
            </button>
          </>
        }
      >
        <div className="modal-body employee-bulk-update__body">
          <p className="employee-bulk-update__help">
            El archivo debe incluir Num Empleado, Puesto, Categoria y Turno. Nada se modifica hasta confirmar.
          </p>

          {errors.length > 0 && (
            <div className="employee-bulk-update__errors" role="alert">
              <p>No se puede aplicar el archivo:</p>
              <ul>
                {errors.map(error => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          {preview && (
            <>
              <div className="employee-bulk-update__summary" role="status">
                <span><strong>{preview.changes.length}</strong> con cambios</span>
                <span><strong>{preview.unchanged}</strong> sin cambios</span>
                <span><strong>{preview.notFound.length}</strong> no encontrados</span>
              </div>

              {preview.notFound.length > 0 && (
                <details className="employee-bulk-update__missing">
                  <summary>Ver números de empleado no encontrados</summary>
                  <p>{preview.notFound.join(', ')}</p>
                </details>
              )}

              {preview.changes.length === 0 ? (
                <p className="employee-bulk-update__empty">El archivo no contiene cambios aplicables.</p>
              ) : (
                <div
                  className="employee-bulk-update__table-wrap"
                  role="region"
                  aria-label="Cambios de puesto, categoría y turno"
                  tabIndex={0}
                >
                  <table className="employee-bulk-update__table">
                    <thead>
                      <tr>
                        <th scope="col">Empleado</th>
                        <th scope="col">Puesto</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Turno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.changes.map(({ employee, update }) => (
                        <tr key={employee.num_empleado}>
                          <td data-label="Empleado">
                            <strong>{employee.nombre}</strong>
                            <span className="employee-bulk-update__number">#{employee.num_empleado}</span>
                          </td>
                          <td data-label="Puesto"><FieldChange current={employee.puesto} next={update.puesto} /></td>
                          <td data-label="Categoría"><FieldChange current={employee.categoria} next={update.categoria} /></td>
                          <td data-label="Turno"><FieldChange current={employee.turno} next={update.turno} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
