import React from 'react';
import './StatCard.css';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  variant?: 'cream' | 'dark';
}

export function StatCard({
  id,
  label,
  value,
  subtitle,
  icon,
  accentColor = 'var(--color-primary)',
  variant = 'cream',
}: StatCardProps) {
  return (
    <div id={id} className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__icon" style={{ color: accentColor }}>
        {icon}
      </div>
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value" style={{ color: accentColor }}>
          {value}
        </span>
        {subtitle && (
          <span className="stat-card__subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
