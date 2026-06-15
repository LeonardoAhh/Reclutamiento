import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './ExpandableSection.css';

interface ExpandableSectionProps {
  title: React.ReactNode;
  /** Badge o contador opcional que aparece junto al título */
  badge?: React.ReactNode;
  /** Contenido que se expande/colapsa */
  children: React.ReactNode;
  /** Estado inicial: expandido o colapsado */
  defaultExpanded?: boolean;
  /** Variante visual */
  variant?: 'default' | 'card' | 'list';
  /** className adicional */
  className?: string;
}

/**
 * Componente de sección expandible/colapsable.
 * Ideal para mostrar detalles adicionales en móvil sin usar modales anidados.
 * Sin hardcoding - solo tokens CSS.
 */
export function ExpandableSection({
  title,
  badge,
  children,
  defaultExpanded = false,
  variant = 'default',
  className = '',
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const classes = [
    'expandable-section',
    `expandable-section--${variant}`,
    isExpanded ? 'expandable-section--expanded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        className="expandable-section__trigger"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="expandable-section__header">
          <span className="expandable-section__title">{title}</span>
          {badge && <span className="expandable-section__badge">{badge}</span>}
        </span>
        <ChevronDown
          size={16}
          className="expandable-section__icon"
          aria-hidden="true"
        />
      </button>
      <div
        className="expandable-section__content"
        aria-hidden={!isExpanded}
      >
        <div className="expandable-section__inner">{children}</div>
      </div>
    </div>
  );
}
