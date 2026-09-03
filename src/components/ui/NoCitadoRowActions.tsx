import { EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { NoCitado } from '@/lib/types';
import './NoCitadoRowActions.css';

interface NoCitadoRowActionsProps {
  noCitado: NoCitado;
  onEdit: (n: NoCitado) => void;
  onDelete?: (n: NoCitado) => void;
}

export function NoCitadoRowActions({
  noCitado,
  onEdit,
  onDelete,
}: NoCitadoRowActionsProps) {
  function run(action: (n: NoCitado) => void) {
    action(noCitado);
  }

  const fullName = `${noCitado.nombre} ${noCitado.apellido || ''}`.trim();

  return (
    <div className="no-citado-row-actions">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Acciones de ${fullName}`}
            title="Acciones"
          >
            <EllipsisVertical aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem asChild>
            <button type="button" onClick={() => run(onEdit)}>
              <PenLine aria-hidden="true" />
              <span>Editar</span>
            </button>
          </DropdownMenuItem>

          {onDelete && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="dropdown-menu-item--danger">
                <button type="button" onClick={() => run(onDelete)}>
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
