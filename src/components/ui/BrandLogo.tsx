import { Command } from 'lucide-react';
import './BrandLogo.css';

type BrandLogoProps = {
  /** Muestra el wordmark "Reclutamiento" junto al badge. */
  showText?: boolean;
  /** Tamaño del badge en px. */
  size?: number;
  className?: string;
};

/**
 * Marca de la app: imagotipo abstracto minimalista + wordmark.
 */
export function BrandLogo({ showText = true, size = 28, className }: BrandLogoProps) {
  return (
    <span className={`brand-logo${className ? ` ${className}` : ''}`}>
      <span className="brand-logo__mark" aria-hidden="true">
        <Command size={size} strokeWidth={2.5} className="brand-logo__svg" />
      </span>
      {showText && <span className="brand-logo__text">Reclutamiento</span>}
    </span>
  );
}