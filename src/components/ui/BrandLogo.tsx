import './BrandLogo.css';

type BrandLogoProps = {
  /** Muestra el wordmark "Reclutamiento" junto al badge. */
  showText?: boolean;
  /** Tamaño del badge en px. */
  size?: number;
  className?: string;
};

/**
 * Marca de la app: badge con monograma "R" + wordmark.
 * El badge usa --color-ink (fondo) y --color-canvas (letra), así se invierte
 * automáticamente entre tema claro y oscuro sin lógica extra.
 */
export function BrandLogo({ showText = true, size = 30, className }: BrandLogoProps) {
  return (
    <span className={`brand-logo${className ? ` ${className}` : ''}`}>
      <span className="brand-logo__mark" aria-hidden="true">
        <svg
          className="brand-logo__svg"
          width={size}
          height={size}
          viewBox="0 0 32 32"
          role="img"
          aria-label="Reclutamiento"
        >
          <rect className="brand-logo__tile" width="32" height="32" rx="9" />
          <text
            className="brand-logo__glyph"
            x="16"
            y="16.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="19"
          >
            R
          </text>
        </svg>
      </span>
      {showText && <span className="brand-logo__text">Reclutamiento</span>}
    </span>
  );
}