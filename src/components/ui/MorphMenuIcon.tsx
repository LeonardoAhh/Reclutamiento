import { PanelLeftClose, PanelLeftOpen } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';

interface MorphMenuIconProps {
  isOpen: boolean;
  size?: number | string;
  className?: string;
}

export function MorphMenuIcon({ isOpen, size, className = '' }: MorphMenuIconProps) {
  return (
    <MorphingIcon
      icon={isOpen ? PanelLeftClose : PanelLeftOpen}
      size={size}
      className={className}
      aria-hidden="true"
    />
  );
}
