import { FoldHorizontal, UnfoldHorizontal } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';

interface MorphMenuIconProps {
  isOpen: boolean;
  size?: number | string;
  className?: string;
}

export function MorphMenuIcon({ isOpen, size, className = '' }: MorphMenuIconProps) {
  return (
    <MorphingIcon
      icon={isOpen ? FoldHorizontal : UnfoldHorizontal}
      size={size}
      className={className}
      spring="smooth"
      aria-hidden="true"
    />
  );
}
