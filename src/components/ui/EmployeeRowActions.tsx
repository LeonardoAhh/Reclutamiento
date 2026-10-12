import { CircleArrowUp, HeartPulse, EllipsisVertical, PenLine, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { Employee } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
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
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);

  function run(action: (emp: Employee) => void) {
    action(employee);
  }

  return (
    <div className="employee-row-actions">
      <div className="employee-row-actions__inline" role="group" aria-label={`${t('Acciones de')} ${employee.nombre}`}>
        <button type="button" className="btn-secondary btn-sm" aria-label={t('Editar')} onClick={() => run(onEdit)}>
          <PenLine aria-hidden="true" />
        </button>
        {onPromote && (
          <button type="button" className="btn-secondary btn-sm" aria-label={t('Promover')} onClick={() => run(onPromote)}>
            <CircleArrowUp aria-hidden="true" />
          </button>
        )}
        <button type="button" className="btn-secondary btn-sm" aria-label={t('Incapacidad')} onClick={() => run(onIncapacidad)}>
          <HeartPulse aria-hidden="true" />
        </button>
        {onDelete && (
          <button type="button" className="btn-danger btn-sm" aria-label={t('Borrar')} onClick={() => run(onDelete)}>
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="employee-row-actions__menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`${t('Acciones de')} ${employee.nombre}`}>
              <EllipsisVertical aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
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
                <DropdownMenuItem
                  asChild
                  variant="destructive"
                  onSelect={() => run(onDelete)}
                >
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
    </div>
  );
}
