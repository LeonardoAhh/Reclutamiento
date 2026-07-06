import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2, StickyNote, BadgeCheck, MessageCircle } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import './CandidateRowActions.css';

interface CandidateRowActionsProps {
  candidate: Candidate;
  notesCount: number;
  onEdit: (c: Candidate) => void;
  onDelete?: (c: Candidate) => void;
  onNotes: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
}

export function CandidateRowActions({
  candidate,
  notesCount,
  onEdit,
  onDelete,
  onNotes,
  onHire,
}: CandidateRowActionsProps) {
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

  function run(action: (c: Candidate) => void) {
    setOpen(false);
    action(candidate);
  }

  const rawFirstName = candidate.nombre.split(' ')[0] || '';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  const rawPuesto = candidate.puesto || '';
  const puestoLower = rawPuesto.toLowerCase();
  const puestoMsg = puestoLower ? puestoLower.charAt(0).toUpperCase() + puestoLower.slice(1) : '';

  return (
    <div className="candidate-row-actions" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="candidate-row-actions__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Acciones de ${candidate.nombre}`}
        title="Acciones"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="candidate-row-actions__menu"
          role="menu"
          aria-label={`Acciones para ${candidate.nombre}`}
        >
          {onHire && (
            <button
              type="button"
              className="candidate-row-actions__item candidate-row-actions__item--primary"
              role="menuitem"
              onClick={() => run(onHire)}
            >
              <BadgeCheck size={14} aria-hidden="true" />
              <span>Contratar</span>
            </button>
          )}

          <button
            type="button"
            className="candidate-row-actions__item"
            role="menuitem"
            onClick={() => run(onNotes)}
          >
            <StickyNote size={14} aria-hidden="true" />
            <span>Notas {notesCount > 0 ? `(${notesCount})` : ''}</span>
          </button>

          <button
            type="button"
            className="candidate-row-actions__item"
            role="menuitem"
            onClick={() => run(onEdit)}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Editar</span>
          </button>

          {onDelete && (
            <>
              <div className="candidate-row-actions__divider" role="separator" />

              <button
                type="button"
                className="candidate-row-actions__item candidate-row-actions__item--danger"
                role="menuitem"
                onClick={() => run(onDelete)}
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>Eliminar</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
