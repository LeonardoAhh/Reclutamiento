import './StatCard.css';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  variant?: 'cream' | 'dark';
}

export function StatCard({
  id,
  label,
  value,
  subtitle,
  accentColor = 'var(--color-primary)',
  variant = 'cream',
}: StatCardProps) {
  return (
    <div
      id={id}
      className={`stat-card stat-card--${variant}`}
      style={{ '--stat-accent': accentColor } as React.CSSProperties}
    >
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {subtitle && (
        <span className="stat-card__subtitle">{subtitle}</span>
      )}
    </div>
  );
}
