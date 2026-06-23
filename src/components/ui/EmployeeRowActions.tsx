import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2, HeartPulse } from 'lucide-react';
import type { Employee } from '@/lib/types';
import './EmployeeRowActions.css';

interface EmployeeRowActionsProps {
  employee: Employee;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onIncapacidad: (emp: Employee) => void;
}

/**
 * Menú de acciones por fila (kebab). Despliega editar / borrar / incapacidad.
 * Cierra con click fuera o Escape; devuelve el foco al trigger.
 */
export function EmployeeRowActions({
  employee,
  onEdit,
  onDelete,
  onIncapacidad,
}: EmployeeRowActionsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const close = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function run(action: (emp: Employee) => void) {
    setOpen(false);
    action(employee);
  }

  return (
    <div className="employee-row-actions" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="employee-row-actions__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Acciones de ${employee.nombre}`}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="employee-row-actions__menu"
          role="menu"
          aria-label={`Acciones para ${employee.nombre}`}
        >
          <button
            type="button"
            className="employee-row-actions__item"
            role="menuitem"
            onClick={() => run(onEdit)}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            className="employee-row-actions__item"
            role="menuitem"
            onClick={() => run(onIncapacidad)}
          >
            <HeartPulse size={14} aria-hidden="true" />
            <span>Incapacidad</span>
          </button>
          <div className="employee-row-actions__divider" role="separator" />
          <button
            type="button"
            className="employee-row-actions__item employee-row-actions__item--danger"
            role="menuitem"
            onClick={() => run(onDelete)}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Borrar</span>
          </button>
        </div>
      )}
    </div>
  );
}
