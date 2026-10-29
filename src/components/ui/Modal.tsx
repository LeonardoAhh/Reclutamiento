import { useContext, useId, useRef } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import { FormSheet } from "./FormSheet";
import { ModalPresentationContext } from "./ModalPresentation";

export interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  labelledById?: string;
  /** Botones de acción que se mostrarán en el footer */
  footerActions?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** En presentación sheet, si se omite se conserva el ancho compacto (`sm`). */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  placement?: "center" | "bottom";
  presentation?: "modal" | "sheet";
  /** Oculta el botón X de cerrar en el encabezado */
  hideCloseButton?: boolean;
  closeLabel?: string;
}

/** Accessible modal shell with Radix-managed focus, dismissal and exit presence. */
export function Modal({
  isOpen,
  title,
  icon,
  onClose,
  onBack,
  children,
  className = "",
  overlayClassName,
  labelledById,
  footerActions,
  headerActions,
  size,
  placement,
  presentation: presentationOverride,
  hideCloseButton = false,
  closeLabel,
}: ModalProps) {
  const configuredPresentation = useContext(ModalPresentationContext);
  const presentation = placement
    ? "modal"
    : presentationOverride ?? configuredPresentation;
  const { language } = useLanguage();
  const resolvedCloseLabel = closeLabel ?? (language === 'en' ? 'Close' : 'Cerrar');
  const generatedTitleId = useId();
  const titleId = labelledById ?? generatedTitleId;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  if (presentation === "sheet") {
    return (
      <FormSheet
        isOpen={isOpen}
        title={title}
        icon={icon}
        onClose={onClose}
        onBack={onBack}
        className={className}
        labelledById={labelledById}
        footerActions={footerActions}
        headerActions={headerActions}
        size={size}
        hideCloseButton={hideCloseButton}
        closeLabel={closeLabel}
      >
        {children}
      </FormSheet>
    );
  }

  const modalSize = size ?? "md";
  const contentClasses = [
    "modal-content",
    `modal-content--${modalSize}`,
    placement && `modal-content--placement-${placement}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCloseRef.current();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={[
            "modal-overlay",
            placement && `modal-overlay--${placement}`,
            overlayClassName,
          ].filter(Boolean).join(" ")}
          role="presentation"
        />
        <DialogPrimitive.Content
          className={contentClasses}
          aria-describedby={undefined}
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <header className="modal-header">
            <div className="modal-title">
              {onBack ? (
                <button
                  type="button"
                  className="modal-back-btn"
                  onClick={onBack}
                  aria-label={language === 'en' ? 'Back' : 'Regresar'}
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
              ) : (
                icon
              )}
              <div className="modal-title__text">
                <DialogPrimitive.Title asChild>
                  <h2 id={titleId}>{title}</h2>
                </DialogPrimitive.Title>
              </div>
            </div>
            {headerActions}
            {!hideCloseButton && (
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="modal-close"
                  aria-label={resolvedCloseLabel}
                  title={resolvedCloseLabel}
                >
                  <X aria-hidden="true" />
                </button>
              </DialogPrimitive.Close>
            )}
          </header>
          <div className="modal-scroll-region">{children}</div>
          {footerActions && (
            <footer className="modal-footer">{footerActions}</footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
