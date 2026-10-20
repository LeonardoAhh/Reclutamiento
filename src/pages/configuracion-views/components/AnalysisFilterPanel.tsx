import { useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/Popover';

interface AnalysisFilterPanelProps {
  children: ReactNode;
  count: number;
  label: string;
  doneLabel: string;
}

export function AnalysisFilterPanel({ children, count, label, doneLabel }: AnalysisFilterPanelProps) {
  const mobile = useMediaQuery('(max-width: 767px)');
  const [open, setOpen] = useState(false);
  if (!mobile) return children;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" data-cuelume-open="" className="btn-secondary analisis-filter-trigger">
          <SlidersHorizontal size="var(--icon-size-sm)" aria-hidden="true" />
          <span>{label}</span>
          {count > 0 && <span>{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="analisis-filter-panel" aria-label={label}>
        <PopoverTitle>{label}</PopoverTitle>
        {children}
        <button type="button" data-cuelume-close="" className="btn-primary" onClick={() => setOpen(false)}>{doneLabel}</button>
      </PopoverContent>
    </Popover>
  );
}
