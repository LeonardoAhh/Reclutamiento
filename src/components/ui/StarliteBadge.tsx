import { Star } from 'lucide-react';
import './StarliteBadge.css';

interface StarliteBadgeProps {
  /**
   * Formato compacto: sólo el icono, sin la etiqueta.
   * Útil en tablas densas o vistas con poco espacio.
   */
  compact?: boolean;
}

/**
 * Etiqueta reutilizable para identificar registros del proyecto Starlite.
 *
 * Diseño minimalista tipo "eyebrow pill" siguiendo la escala del sistema
 * (tokens de color, tipografía y espaciado — sin hardcodes). Accesible:
 * expone un `role="img"` con etiqueta descriptiva para lectores de pantalla.
 */
export function StarliteBadge({ compact = false }: StarliteBadgeProps = {}) {
  return (
    <span
      className={`starlite-badge${compact ? ' starlite-badge--compact' : ''}`}
      role="img"
      aria-label="Proyecto Starlite"
      title="Proyecto Starlite"
    >
      <Star
        size={12}
        aria-hidden="true"
        strokeWidth={2.25}
        fill="currentColor"
      />
      {!compact && <span className="starlite-badge__label">Starlite</span>}
    </span>
  );
}
