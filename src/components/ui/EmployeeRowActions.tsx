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
          <DropdownMenuItem asChild onSelect={() => run(onEdit)}>
            <button type="button">
              <PenLine aria-hidden="true" />
              <span>Editar</span>
            </button>
          </DropdownMenuItem>
          {onPromote && (
            <DropdownMenuItem asChild onSelect={() => run(onPromote)}>
              <button type="button">
                <CircleArrowUp aria-hidden="true" />
                <span>Promover</span>
              </button>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild onSelect={() => run(onIncapacidad)}>
            <button type="button">
              <HeartPulse aria-hidden="true" />
              <span>Incapacidad</span>
            </button>
          </DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                asChild
                variant="destructive"
                onSelect={() => run(onDelete)}
              >
                <button type="button">
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
