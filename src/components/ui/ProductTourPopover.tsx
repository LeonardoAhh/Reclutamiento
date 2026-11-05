import { useId, type CSSProperties, type RefObject } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/Popover';
import type { ProductTourStep } from '@/features/onboarding/productTourSteps';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { AccountCopy } from '@/pages/account-translations';
import './ProductTour.css';

interface ProductTourPopoverProps {
  step: ProductTourStep;
  stepIndex: number;
  stepCount: number;
  storageError: boolean;
  copy: AccountCopy['productTour'];
  anchorStyle: CSSProperties;
  dialogRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function ProductTourPopover({
  step,
  stepIndex,
  stepCount,
  storageError,
  copy,
  anchorStyle,
  dialogRef,
  onClose,
  onBack,
  onNext,
}: ProductTourPopoverProps) {
  const id = useId();
  const isMobile = useIsMobile();
  const isTargetStep = step.side !== 'center';

  return (
    <Popover open>
      <PopoverAnchor asChild>
        <span className="product-tour__anchor" style={anchorStyle} aria-hidden="true" />
      </PopoverAnchor>
      <PopoverContent
        ref={dialogRef}
        className="product-tour__popover"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        data-tour-centered={step.side === 'center' || undefined}
        align={isMobile && isTargetStep ? 'start' : 'center'}
        side={isMobile && step.side === 'right' ? 'top' : step.side === 'right' ? 'right' : 'bottom'}
        sideOffset={step.side === 'center' ? 0 : undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <header className="product-tour__header">
          <h2 className="product-tour__title" id={`${id}-title`}>
            {step.title}
          </h2>
          <button type="button" className="btn-ghost product-tour__close" aria-label={copy.close} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="product-tour__body">
          <p className="product-tour__description" id={`${id}-description`}>
            {step.text}
          </p>
          {storageError && <output className="product-tour__storage-error">{copy.storageFailed}</output>}
        </div>
        <footer className="product-tour__footer">
          <span className="product-tour__count" aria-label={`${copy.step} ${stepIndex + 1} ${copy.of} ${stepCount}`}>
            {stepIndex + 1}/{stepCount}
          </span>
          <div className="product-tour__actions">
            {stepIndex > 0 && (
              <button type="button" className="btn-ghost btn-sm" onClick={onBack}>
                {copy.back}
              </button>
            )}
            <button type="button" className="btn-primary btn-sm" onClick={onNext}>
              {stepIndex === 0 ? copy.start : stepIndex === stepCount - 1 ? copy.finish : copy.next}
            </button>
          </div>
        </footer>
        {step.side !== 'center' && <PopoverPrimitive.Arrow className="product-tour__arrow" />}
      </PopoverContent>
    </Popover>
  );
}
