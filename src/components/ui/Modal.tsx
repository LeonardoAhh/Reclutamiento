import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledById?: string;
  /** Botones de acción que se mostrarán en el header antes del botón de cerrar */
  headerActions?: React.ReactNode;
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
  subtitle,
  icon,
  onClose,
  children,
  className = '',
  labelledById = 'modal-title',
  headerActions,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    // Focus the first focusable element inside the modal
    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !contentRef.current) return;

      const items = contentRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={`modal-content ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-title">
            {icon}
            <div>
              <h2 id={labelledById}>{title}</h2>
              {subtitle && <span className="modal-title__sub">{subtitle}</span>}
            </div>
          </div>
          <div className="modal-header-actions">
            {headerActions}
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
