import './StatCard.css';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  id: string;
  label: string | React.ReactNode;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  variant?: 'cream' | 'dark';
}

/**
 * Descompone un valor (number o string tipo "95%", "+3") en prefijo,
 * número y sufijo para poder animar el conteo conservando el formato.
 * Si no encuentra una parte numérica, devuelve null (se renderiza tal cual).
 */
function parseAnimatable(
  value: string | number,
): { prefix: string; num: number; suffix: string; decimals: number } | null {
  if (typeof value === 'number') {
    return { prefix: '', num: value, suffix: '', decimals: 0 };
  }
  const match = value.match(/^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const decimals = numStr.includes('.') ? (numStr.split('.')[1]?.length ?? 0) : 0;
  return { prefix, num: Number(numStr), suffix, decimals };
}

export function StatCard({
  id,
  label,
  value,
  subtitle,
  accentColor = 'var(--color-primary)',
  variant = 'cream',
}: StatCardProps) {
  const animatable = parseAnimatable(value);

  return (
    <div
      id={id}
      className={`stat-card stat-card--${variant}`}
      style={{ '--stat-accent': accentColor } as React.CSSProperties}
    >
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">
        {animatable ? (
          <AnimatedNumber
            value={animatable.num}
            prefix={animatable.prefix}
            suffix={animatable.suffix}
            decimals={animatable.decimals}
          />
        ) : (
          value
        )}
      </span>
      {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
    </div>
  );
}
