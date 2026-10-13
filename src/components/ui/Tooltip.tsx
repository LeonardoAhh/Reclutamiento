import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import {
  FLOATING_SURFACE_COLLISION_PADDING,
  FLOATING_SURFACE_SIDE_OFFSET,
} from '@/lib/floatingSurface';
import './Tooltip.css';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayMs?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ content, children, side = 'top', delayMs, open, onOpenChange }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayMs} open={open} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={FLOATING_SURFACE_SIDE_OFFSET}
          collisionPadding={FLOATING_SURFACE_COLLISION_PADDING}
          className="tooltip-content"
        >
          {content}
          <TooltipPrimitive.Arrow className="tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
