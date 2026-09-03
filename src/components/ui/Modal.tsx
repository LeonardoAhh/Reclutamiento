import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
  labelledById?: string;
  /** Botones de acción que se mostrarán en el footer */
  footerActions?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Oculta el botón X de cerrar en el encabezado */
  hideCloseButton?: boolean;
}

const openModalStack: symbol[] = [];
let bodyScrollLockCount = 0;
let bodyOverflowBeforeModal = "";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      !element.hasAttribute("hidden") &&
      element.getClientRects().length > 0,
  );
}

/**
 * Accessible modal shell:
 *  - closes on Esc and click on scrim
 *  - traps focus inside the dialog
 *  - locks body scroll while open
 *  - returns focus to the previously focused element on close
 */
export function Modal({
  isOpen,
  title,
  icon,
  onClose,
  onBack,
  children,
  className = "",
  labelledById,
  footerActions,
  size = "md",
  hideCloseButton = false,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalInstanceRef = useRef(Symbol("modal"));
  const generatedTitleId = useId();
  const titleId = labelledById ?? generatedTitleId;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const modalInstance = modalInstanceRef.current;
    openModalStack.push(modalInstance);

    if (bodyScrollLockCount === 0) {
      bodyOverflowBeforeModal = body.style.overflow;
    }
    bodyScrollLockCount += 1;
    body.style.overflow = "hidden";

    const content = contentRef.current;
    const firstFocusable = content ? getFocusableElements(content)[0] : null;
    (firstFocusable ?? content)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (openModalStack[openModalStack.length - 1] !== modalInstance) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !contentRef.current) return;

      const items = getFocusableElements(contentRef.current);
      if (items.length === 0) {
        e.preventDefault();
        contentRef.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (!contentRef.current.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const stackIndex = openModalStack.lastIndexOf(modalInstance);
      if (stackIndex >= 0) openModalStack.splice(stackIndex, 1);

      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
      if (bodyScrollLockCount === 0) {
        body.style.overflow = bodyOverflowBeforeModal;
      }
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = [
    "modal-content",
    `modal-content--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={contentClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-title">
            {onBack ? (
              <button
                type="button"
                className="modal-back-btn"
                onClick={onBack}
                aria-label="Regresar"
              >
                <ArrowLeft aria-hidden="true" />
              </button>
            ) : (
              icon
            )}
            <div className="modal-title__text">
              <h2 id={titleId}>{title}</h2>
            </div>
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </header>
        <div className="modal-scroll-region">{children}</div>
        {footerActions && (
          <footer className="modal-footer">{footerActions}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
