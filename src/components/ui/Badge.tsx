import { Star, UserRound, Briefcase, Users, LifeBuoy } from 'lucide-react';
import type { RECLUTADORES_INFO } from '@/lib/constants';
import { Tooltip } from './Tooltip';
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

export const StarliteBadge = ({ compact = false }: { compact?: boolean } = {}) => (
  <Tooltip content="Starlite">
    <span className={`project-badge project-badge--starlite${compact ? ' project-badge--compact' : ''}`}>
      <Star size="1em" className="project-badge__icon" aria-hidden="true" />
      {!compact && <span>Starlite</span>}
    </span>
  </Tooltip>
);

export const VinoplasticBadge = () => (
  <Tooltip content="ViñoPlastic">
    <span className="project-badge project-badge--vinoplastic">
      ViñoPlastic
    </span>
  </Tooltip>
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

export { ReclutadorBadge, getReclutadorMeta } from './ReclutadorBadge';
export type { ReclutadorBadgeProps } from './ReclutadorBadge';

// ─── Status Badges (Plantilla, Backup) ───

interface StatusBadgeProps {
  /** Variación minimalista solo con el icono y tooltip */
  iconOnly?: boolean;
  className?: string;
}

export function PlantillaBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  const Icon = Users;
  const label = "Plantilla";

  if (iconOnly) {
    return (
      <Tooltip content={label}>
        <span className={`status-badge status-badge--plantilla status-badge--icon-only ${className}`.trim()} aria-label={label} role="img">
          <Icon size={14} className="status-badge__icon" aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={`status-badge status-badge--plantilla ${className}`.trim()}>
      <Icon size={14} className="status-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function BackupBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  const Icon = LifeBuoy;
  const label = "Backup";

  if (iconOnly) {
    return (
      <Tooltip content={label}>
        <span className={`status-badge status-badge--backup status-badge--icon-only ${className}`.trim()} aria-label={label} role="img">
          <Icon size={14} className="status-badge__icon" aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={`status-badge status-badge--backup ${className}`.trim()}>
      <Icon size={14} className="status-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
