import { useState } from 'react';
import { BadgeCheck, CheckCircle2, FileImage, MessageCircle, MoreVertical, Pencil, StickyNote, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import type { Candidate } from '@/lib/types';
import './CandidateRowActions.css';

interface CandidateRowActionsProps {
  candidate: Candidate;
  notesCount: number;
  onEdit: (c: Candidate) => void;
  onDelete?: (c: Candidate) => void;
  onNotes: (c: Candidate) => void;
  onAccessCard?: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
}

export function CandidateRowActions({
  candidate,
  notesCount,
  onEdit,
  onDelete,
  onNotes,
  onAccessCard,
  onHire,
}: CandidateRowActionsProps) {
  const [open, setOpen] = useState(false);

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
    <div className="candidate-row-actions">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="candidate-row-actions__trigger"
            aria-label={`Acciones de ${candidate.nombre}`}
            title="Acciones"
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
          {candidate.telefono && (
            <a
              href={`https://wa.me/52${candidate.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${firstName}, te escribo de Reclutamiento Querétaro para darle seguimiento a tu proceso para la vacante de ${puestoMsg}. ¿Cómo vas? ¿Tienes alguna duda? ¿Algo en lo que se te pueda ayudar?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="candidate-row-actions__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <MessageCircle size={14} aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          )}
          {onAccessCard && (
            <button
              type="button"
              className="candidate-row-actions__item"
              role="menuitem"
              onClick={() => run(onAccessCard)}
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
