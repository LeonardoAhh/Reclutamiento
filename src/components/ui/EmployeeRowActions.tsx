import { CircleArrowUp, HeartPulse, EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { IncapacidadBadge, ProximoIngresoBadge, StarliteBadge } from '@/components/ui/Badge';
import type { Employee } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import './EmployeeRowActions.css';

interface EmployeeRowActionsProps {
  employee: Employee;
  isUpcomingHire: boolean;
  onEdit: (emp: Employee) => void;
  onPromote?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
  onIncapacidad: (emp: Employee) => void;
}

export function EmployeeRowActions({
  employee,
  isUpcomingHire,
  onEdit,
  onPromote,
  onDelete,
  onIncapacidad,
}: EmployeeRowActionsProps) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const hasStatuses = employee.en_incapacidad || employee.is_starlite || isUpcomingHire;

  function run(action: (emp: Employee) => void) {
    action(employee);
  }

  return (
    <div className="employee-row-actions">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`${t('Acciones de')} ${employee.nombre}`}>
            <EllipsisVertical aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {hasStatuses && (
            <>
              <DropdownMenuLabel>{t('Estado')}</DropdownMenuLabel>
              <div className="employee-row-actions__statuses">
                {employee.en_incapacidad && <IncapacidadBadge label={t('Incapacidad')} />}
                {employee.is_starlite && <StarliteBadge label={t('Starlite')} />}
                {isUpcomingHire && <ProximoIngresoBadge label={t('Próximo ingreso')} />}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild onSelect={() => run(onEdit)}>
            <button type="button">
              <PenLine aria-hidden="true" />
              <span>{t('Editar')}</span>
            </button>
          </DropdownMenuItem>
          {onPromote && (
            <DropdownMenuItem asChild onSelect={() => run(onPromote)}>
              <button type="button">
                <CircleArrowUp aria-hidden="true" />
                <span>{t('Promover')}</span>
              </button>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild onSelect={() => run(onIncapacidad)}>
            <button type="button">
              <HeartPulse aria-hidden="true" />
              <span>{t('Incapacidad')}</span>
            </button>
          </DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild variant="destructive" onSelect={() => run(onDelete)}>
                <button type="button">
                  <Trash2 aria-hidden="true" />
                  <span>{t('Borrar')}</span>
                </button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
