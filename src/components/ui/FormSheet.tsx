import { useId, useRef, type RefObject } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ModalProps } from "./Modal";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "./Sheet";
import { cn } from "@/lib/utils-shadcn";
import "./FormSheet.css";

type FormSheetProps = ModalProps & {
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function FormSheet({
  isOpen, onClose, onBack, className, title, footerActions, headerActions, children,
  hideCloseButton = false, closeLabel, labelledById, returnFocusRef, onCloseAutoFocus, size = "sm",
}: FormSheetProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const { language } = useLanguage();
  const generatedTitleId = useId();
  const titleId = labelledById ?? generatedTitleId;

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent
        variant="floating"
        size={size}
        className={cn("form-sheet", className)}
        aria-describedby={undefined}
        aria-labelledby={titleId}
        onOpenAutoFocus={() => {
          triggerRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement : null;
        }}
        onCloseAutoFocus={event => {
          onCloseAutoFocus?.(event);
          if (event.defaultPrevented) return;
          const returnFocusTarget = returnFocusRef?.current;
          const focusTarget = returnFocusTarget?.isConnected
            ? returnFocusTarget : triggerRef.current;
          if (focusTarget?.isConnected) {
            event.preventDefault();
            focusTarget.focus();
          }
        }}
      >
        <SheetHeader hideCloseButton={hideCloseButton} closeLabel={closeLabel}>
          <div className="modal-title">
            {onBack ? (
              <button type="button" className="modal-back-btn" onClick={onBack}
                aria-label={language === "en" ? "Back" : "Regresar"}>
                <ArrowLeft aria-hidden="true" />
              </button>
            ) : null}
            <SheetTitle><span id={titleId}>{title}</span></SheetTitle>
          </div>
          {headerActions}
        </SheetHeader>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Scrollable content must be keyboard reachable. */}
        <section className="sheet-body modal-scroll-region" aria-labelledby={titleId} tabIndex={0}>
          {children}
        </section>
        {footerActions && <SheetFooter>{footerActions}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
