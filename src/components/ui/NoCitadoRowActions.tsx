import { useState } from 'react';
import { CircleCheckBig, EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
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
  const [open, setOpen] = useState(false);

  function run(action: (n: NoCitado) => void) {
    setOpen(false);
    action(noCitado);
  }

  const fullName = `${noCitado.nombre} ${noCitado.apellido || ''}`.trim();

  return (
    <div className="no-citado-row-actions">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="no-citado-row-actions__trigger"
            aria-label={`Acciones de ${fullName}`}
            title="Acciones"
          >
            <EllipsisVertical size={16} aria-hidden="true" />
          </button>
        </PopoverTrigger>

        <PopoverContent 
          side="bottom" 
          align="end" 
          sideOffset={4}
          className="no-citado-row-actions__menu"
          style={{ padding: 'var(--spacing-xs)', border: '1px solid var(--color-hairline)' }}
        >
          <button
            type="button"
            className="no-citado-row-actions__item"
            role="menuitem"
            onClick={() => run(onEdit)}
          >
            <PenLine size={14} aria-hidden="true" />
            <span>Editar</span>
          </button>

          {onDelete && (
            <>
              <div className="no-citado-row-actions__divider" role="separator" />

              <button
                type="button"
                className="no-citado-row-actions__item no-citado-row-actions__item--danger"
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