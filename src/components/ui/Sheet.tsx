import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './Sheet.css';

interface SheetProps {
  isOpen: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra class on the dialog surface (not the scrim). */
  className?: string;
  /** Side from which to slide on desktop (≥768px). Mobile always bottom. */
  side?: 'right' | 'bottom';
  /** Width in desktop ("right" side). Defaults to a comfortable form width. */
  width?: 'sm' | 'md' | 'lg';
}

/**
 * Mobile-first sheet primitive (shadcn-style).
 *  - Mobile (<768px): slides up from the bottom, rounded top corners.
 *  - Desktop (>=768px): slides in from the chosen side (right by default).
 *
 * Same a11y guarantees as `Modal`: focus trap, Esc to close, scrim click to
 * close, body scroll lock, and focus returns to the previously focused
 * element on unmount.
 *
 * All colors, fonts, spacing and radii come from design tokens — no
 * hardcoded values.
 */
export function Sheet({
  isOpen,
  title,
  subtitle,
  icon,
  onClose,
  children,
  className = '',
  side = 'right',
  width = 'md',
}: SheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

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

  const classes = [
    'sheet',
    `sheet--${side}`,
    `sheet--w-${width}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="sheet-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={classes}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="sheet__header">
          <div className="sheet__title">
            {icon}
            <div className="sheet__title-text">
              <h2 id={titleId}>{title}</h2>
              {subtitle && <span className="sheet__subtitle">{subtitle}</span>}
            </div>
          </div>
          <button
            type="button"
            className="sheet__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
