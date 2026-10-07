import { useRef, type RefObject } from "react";
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
  isOpen, onClose, onBack, className, icon, title, footerActions, children,
  hideCloseButton = false, closeLabel, labelledById, returnFocusRef,
}: FormSheetProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const { language } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent
        variant="floating"
        className={cn("form-sheet", className)}
        aria-describedby={undefined}
        {...(labelledById ? { "aria-labelledby": labelledById } : {})}
        onOpenAutoFocus={() => {
          triggerRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement : null;
        }}
        onCloseAutoFocus={event => {
          const focusTarget = returnFocusRef?.current ?? triggerRef.current;
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
            ) : icon}
            <SheetTitle>{labelledById ? <span id={labelledById}>{title}</span> : title}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="modal-scroll-region">{children}</div>
        {footerActions && <SheetFooter>{footerActions}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
