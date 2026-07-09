import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button component — aligned with desing.md Notion-style system.
 *
 * Rules per desing.md:
 * - Primary CTA: pill-shaped (rounded-full), Notion blue fill.
 * - Secondary: pill-shaped, white surface + hairline border.
 * - Outline / ghost: 8px radius (rounded-md) utility buttons.
 *
 * Elevation: barely-there layered shadow on surface variants,
 * never heavy drop-shadows.
 */
const buttonVariants = cva(
  // Base — inline-flex, gap, whitespace, font, transitions, disabled
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — Notion blue pill · only structural CTA
        default:
          'rounded-full bg-primary text-on-primary hover:bg-primary-active active:scale-95',

        // Secondary — white pill + hairline · secondary actions
        secondary:
          'rounded-full bg-surface text-ink border border-hairline shadow-soft hover:bg-surface-card active:scale-95',

        // Outline — 8px radius · utility actions per desing.md
        outline:
          'rounded-md border border-hairline bg-surface text-ink shadow-soft hover:bg-surface-card',

        // Ghost — 8px radius · low-emphasis
        ghost:
          'rounded-md text-ink hover:bg-surface-card',

        // Destructive
        destructive:
          'rounded-full bg-error text-white hover:bg-error/90 active:scale-95',
      },
      size: {
        default: 'h-9 px-5 py-1 text-button-md',
        sm:      'h-8 px-3 text-caption-md',
        lg:      'h-11 px-6 text-body-md',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
