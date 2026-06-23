import type { CSSProperties } from 'react';
import './Skeleton.css';

type SkeletonVariant = 'rect' | 'text' | 'circle';

interface SkeletonProps {
  /** Variante de forma. `text` usa altura de línea y bordes suaves. */
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  /** Radio de borde explícito (sobre-escribe el de la variante). */
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
}

function toCss(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Bloque de carga reutilizable. Anima un shimmer sobre un bloque neutro que
 * respeta los tokens de superficie del sistema. Se desactiva la animación con
 * `prefers-reduced-motion`. Marcado como `aria-hidden` porque el estado de
 * carga se anuncia a nivel de página, no por bloque.
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton skeleton--${variant}${className ? ` ${className}` : ''}`}
      style={{
        width: toCss(width),
        height: toCss(height),
        borderRadius: toCss(radius),
        ...style,
      }}
    />
  );
}
