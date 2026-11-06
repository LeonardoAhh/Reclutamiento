import type { ReactNode } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

interface DataUpdateRecordActionsProps {
  'aria-label': string;
  children: ReactNode;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DataUpdateRecordActions({
  'aria-label': ariaLabel,
  children,
  disabled,
  open,
  onOpenChange,
}: DataUpdateRecordActionsProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="dropdown-menu-trigger data-update-record-actions"
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <EllipsisVertical aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="data-update-admin-card__popover">
        {children}
      </PopoverContent>
    </Popover>
  );
}
