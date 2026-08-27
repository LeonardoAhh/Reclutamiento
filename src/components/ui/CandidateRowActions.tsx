import { useState } from 'react';
import { BadgeCheck, FileImage, MoreVertical, Pencil, Trash2, UserMinus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Acciones de ${candidate.nombre}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreVertical aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {candidate.reclutador && (
            <>
              <div className="candidate-row-actions__info">
                <span className="candidate-row-actions__info-label">Reclutador</span>
                <ReclutadorBadge nombre={candidate.reclutador} />
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {onAccessCard && (
            <DropdownMenuItem asChild>
              <button type="button" onClick={(e) => run(e, onAccessCard)}>
                <FileImage aria-hidden="true" />
                <span>Ver pase</span>
              </button>
            </DropdownMenuItem>
          )}

          {onHire && (
            <DropdownMenuItem asChild>
              <button type="button" onClick={(e) => run(e, onHire)}>
                <BadgeCheck aria-hidden="true" />
                <span>Contratar</span>
              </button>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <button type="button" onClick={(e) => run(e, onEdit)}>
              <Pencil aria-hidden="true" />
              <span>Editar</span>
            </button>
          </DropdownMenuItem>

          {onBaja && (
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="dropdown-menu-item--danger"
                onClick={(e) => run(e, onBaja)}
              >
                <UserMinus aria-hidden="true" />
                <span>Baja</span>
              </button>
            </DropdownMenuItem>
          )}

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="dropdown-menu-item--danger"
                  onClick={(e) => run(e, onDelete)}
                >
                  <Trash2 aria-hidden="true" />
                  <span>Eliminar</span>
                </button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
