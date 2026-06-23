import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EASE_OUT } from '@/lib/motion';

interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledById?: string;
  /** Botones de acción que se mostrarán en el footer */
  footerActions?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  /** Si es true, el modal será fullscreen en móvil. Por defecto true, excepto para confirmaciones pequeñas. */
  fullscreenMobile?: boolean;
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
  children,
  className = '',
  labelledById = 'modal-title',
  footerActions,
  size = 'md',
  fullscreenMobile = true,
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

  const contentClasses = [
    'modal-content',
    `modal-content--${size}`,
    fullscreenMobile ? 'modal-fullscreen-mobile' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <motion.div
      className="modal-overlay"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={contentRef}
        className={contentClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE_OUT }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-title">
            {icon}
            <div className="modal-title__text">
              <h2 id={labelledById}>{title}</h2>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
        {footerActions && (
          <footer className="modal-footer">
            {footerActions}
          </footer>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}
