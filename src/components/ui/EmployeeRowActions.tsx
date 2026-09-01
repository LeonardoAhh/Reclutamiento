import { CircleArrowUp, HeartPulse, EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { Employee } from '@/lib/types';
import './EmployeeRowActions.css';

interface EmployeeRowActionsProps {
  employee: Employee;
  onEdit: (emp: Employee) => void;
  onPromote?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
  onIncapacidad: (emp: Employee) => void;
}

export function EmployeeRowActions({
  employee,
  onEdit,
  onPromote,
  onDelete,
  onIncapacidad,
}: EmployeeRowActionsProps) {
  function run(action: (emp: Employee) => void) {
    action(employee);
  }

  return (
    <div className="employee-row-actions">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Acciones de ${employee.nombre}`}>
            <EllipsisVertical aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={() => run(onEdit)}
            >
              <PenLine aria-hidden="true" />
              <span>Editar</span>
            </button>
          </DropdownMenuItem>
          {onPromote && (
            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={() => run(onPromote)}
              >
                <CircleArrowUp aria-hidden="true" />
                <span>Promover</span>
              </button>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={() => run(onIncapacidad)}
            >
              <HeartPulse aria-hidden="true" />
              <span>Incapacidad</span>
            </button>
          </DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="dropdown-menu-item--danger"
                  onClick={() => run(onDelete)}
                >
                  <Trash2 aria-hidden="true" />
                  <span>Borrar</span>
                </button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
