import { useState } from 'react';
import { FileImage, EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
}

export function CandidateRowActions({
  candidate,
  onEdit,
  onDelete,
  onAccessCard,
}: CandidateRowActionsProps) {
  const [open, setOpen] = useState(false);

  function run(event: Event, action: (c: Candidate) => void) {
    event.stopPropagation();
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
            <EllipsisVertical aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {candidate.reclutador && (
            <>
              <DropdownMenuLabel className="candidate-row-actions__info">
                <span className="candidate-row-actions__info-label">Reclutador</span>
                <ReclutadorBadge nombre={candidate.reclutador} />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            {onAccessCard && (
              <DropdownMenuItem asChild onSelect={(event) => run(event, onAccessCard)}>
                <button type="button">
                  <FileImage aria-hidden="true" />
                  <span>Ver pase</span>
                </button>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild onSelect={(event) => run(event, onEdit)}>
              <button type="button">
                <PenLine aria-hidden="true" />
                <span>Editar</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  variant="destructive"
                  onSelect={(event) => run(event, onDelete)}
                >
                  <button type="button">
                    <Trash2 aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
