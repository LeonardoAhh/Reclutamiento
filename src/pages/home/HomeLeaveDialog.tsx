import type { ComponentProps, RefObject } from "react";
import { ArrowLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/Sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useIsMobile";

type HomeLeaveDialogProps = Pick<ComponentProps<typeof Modal>,
  "isOpen" | "onClose" | "onBack" | "title" | "children" | "footerActions" | "size" | "className"
> & {
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function HomeLeaveDialog({ triggerRef, ...props }: HomeLeaveDialogProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  if (isMobile) return <Modal {...props} />;

  return (
    <Sheet open={props.isOpen} onOpenChange={open => { if (!open) props.onClose(); }}>
      <SheetContent
        variant="floating"
        className={props.className}
        aria-describedby={undefined}
        onCloseAutoFocus={event => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <SheetHeader>
          <div className="home-page__leave-sheet-heading">
            {props.onBack && (
              <button
                type="button"
                className="modal-back-btn"
                onClick={props.onBack}
                aria-label={language === "en" ? "Back" : "Regresar"}
              >
                <ArrowLeft aria-hidden="true" />
              </button>
            )}
            <SheetTitle>{props.title}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="modal-scroll-region">{props.children}</div>
        {props.footerActions && <SheetFooter>{props.footerActions}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
