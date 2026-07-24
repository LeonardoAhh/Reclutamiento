import { Star } from 'lucide-react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {children}
    </span>
  );
}

export const StarliteBadge = () => (
  <span className="project-badge project-badge--starlite" title="Proyecto: Starlite">
    <Star size="1em" className="project-badge__icon" aria-hidden="true" />
    <span>Starlite</span>
  </span>
);

export const VinoplasticBadge = () => (
  <span className="project-badge project-badge--vinoplastic" title="Proyecto: ViñoPlastic">
    ViñoPlastic
  </span>
);

interface RoleBadgeProps {
  role?: string;
  label?: string;
}

export function RoleBadge({ role = 'default', label }: RoleBadgeProps) {
  const displayLabel = label || role;
  return (
    <span className={`role-badge role-badge--${role.toLowerCase()}`}>
      <span className="session-role">{displayLabel}</span>
    </span>
  );
}
