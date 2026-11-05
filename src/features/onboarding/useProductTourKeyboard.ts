import { useEffect, type RefObject } from 'react';

interface ProductTourKeyboardOptions {
  isOpen: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
  target: HTMLElement | null;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function useProductTourKeyboard({
  isOpen,
  dialogRef,
  target,
  onClose,
  onNext,
  onBack,
}: ProductTourKeyboardOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onBack();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialogButtons = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      const focusable = target?.matches('button:not(:disabled), a[href]') ? [target, ...dialogButtons] : dialogButtons;
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (!dialogRef.current?.contains(activeElement) && activeElement !== target) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [dialogRef, isOpen, onBack, onClose, onNext, target]);
}
