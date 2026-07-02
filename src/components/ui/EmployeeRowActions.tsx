import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, right: 'auto' as const });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Calcular posición del menú relativa al viewport
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 170; // min-width + padding aproximado
      const padding = 8;
      const availableRight = window.innerWidth - rect.right;

      let left = rect.right;
      let right: number | 'auto' = 'auto';

      // Si no hay espacio a la derecha, alinear a la izquierda del botón
      if (availableRight < menuWidth) {
        left = Math.max(padding, rect.left - menuWidth);
        right = 'auto';
      }

      setMenuPos({
        top: rect.bottom + 4,
        left,
        right,
      });
    }

    const close = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      const isInTrigger = triggerRef.current?.contains(target);
      const isInMenu = menuRef.current?.contains(target);

      if (!isInTrigger && !isInMenu) {
        setOpen(false);
      }
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

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="employee-row-actions__menu"
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              right: menuPos.right === 'auto' ? 'auto' : undefined,
            }}
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
          </div>,
          document.body
        )}
    </div>
  );
}
