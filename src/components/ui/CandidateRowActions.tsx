import { useState } from 'react';
import { BadgeCheck, CheckCircle2, FileImage, MoreVertical, Pencil, StickyNote, Trash2, User, UserMinus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import type { Candidate } from '@/lib/types';
import { ReclutadorBadge } from '@/components/ui/Badge';
import './CandidateRowActions.css';

interface CandidateRowActionsProps {
  candidate: Candidate;
  onEdit: (c: Candidate) => void;
  onDelete?: (c: Candidate) => void;
  onAccessCard?: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
  onBaja?: (c: Candidate) => void;
}

export function CandidateRowActions({
  candidate,
  onEdit,
  onDelete,
  onAccessCard,
  onHire,
  onBaja,
}: CandidateRowActionsProps) {
  const [open, setOpen] = useState(false);

  function run(e: React.MouseEvent, action: (c: Candidate) => void) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(false);
    action(candidate);
  }

  return (
    <div className="candidate-row-actions">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="candidate-row-actions__trigger"
            aria-label={`Acciones de ${candidate.nombre}`}
            title="Acciones"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>
        </PopoverTrigger>

        <PopoverContent 
          side="bottom" 
          align="end" 
          sideOffset={4}
          className="candidate-row-actions__menu"
        >
          {candidate.reclutador && (
            <>
              <div className="candidate-row-actions__info">
                <span className="candidate-row-actions__info-label">Reclutador</span>
                <ReclutadorBadge nombre={candidate.reclutador} />
              </div>
              <div className="candidate-row-actions__divider" role="separator" />
            </>
          )}

          {onAccessCard && (
            <button
              type="button"
              className="candidate-row-actions__item"
              role="menuitem"
              onClick={(e) => run(e, onAccessCard)}
            >
              <FileImage size={14} aria-hidden="true" />
              <span>Ver pase</span>
            </button>
          )}

          {onHire && (
            <button
              type="button"
              className="candidate-row-actions__item candidate-row-actions__item--primary"
              role="menuitem"
              onClick={(e) => run(e, onHire)}
            >
              <BadgeCheck size={14} aria-hidden="true" />
              <span>Contratar</span>
            </button>
          )}


          <button
            type="button"
            className="candidate-row-actions__item"
            role="menuitem"
            onClick={(e) => run(e, onEdit)}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Editar</span>
          </button>

          {onBaja && (
            <button
              type="button"
              className="candidate-row-actions__item candidate-row-actions__item--danger"
              role="menuitem"
              onClick={(e) => run(e, onBaja)}
            >
              <UserMinus size={14} aria-hidden="true" />
              <span>Baja</span>
            </button>
          )}

          {onDelete && (
            <>
              <div className="candidate-row-actions__divider" role="separator" />

              <button
                type="button"
                className="candidate-row-actions__item candidate-row-actions__item--danger"
                role="menuitem"
                onClick={(e) => run(e, onDelete)}
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>Eliminar</span>
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
