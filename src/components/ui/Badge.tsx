import { Briefcase, CalendarClock, CircleCheckBig, HeartPulse, LifeBuoy, Star, UserRound, UsersRound } from 'lucide-react';
import type { RECLUTADORES_INFO } from '@/lib/constants';
import { Tooltip } from './Tooltip';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'neutral-solid' | 'coral' | 'teal' | 'amber' | 'success' | 'error' | 'error-solid';
  minimal?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', minimal = false, className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${minimal ? 'badge--minimal' : ''} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export const StarliteBadge = ({ compact = false }: { compact?: boolean } = {}) => {
  const Icon = Star;
  const label = "Starlite";

  if (compact) {
    return (
      <Tooltip content={label}>
        <span className="status-badge status-badge--starlite status-badge--icon-only" aria-label={label} role="img">
          <Icon size={14} className="status-badge__icon" aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="status-badge status-badge--starlite">
      <Icon size={14} className="status-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

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
  
  let variant: 'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error' = 'default';
  const roleLower = role.toLowerCase();
  
  if (roleLower === 'admin' || roleLower === 'administrador') {
    variant = 'coral';
  } else if (roleLower === 'reclutador' || roleLower === 'reclutadora') {
    variant = 'teal';
  } else if (roleLower === 'gerente') {
    variant = 'amber';
  }

  return <Badge variant={variant}>{displayLabel}</Badge>;
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
  const Icon = UsersRound;
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

export interface AreaStatusBadgeProps {
  type: 'proceso' | 'ingreso' | 'sin_proceso';
  count?: number;
}

export function AreaStatusBadge({ type, count }: AreaStatusBadgeProps) {
  const label = type === 'proceso' ? 'Proceso' : type === 'ingreso' ? 'Ingreso' : 'Sin proceso';
  return (
    <span className={`status-badge status-badge--${type}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{label}{count !== undefined && count > 0 ? ` (${count})` : ''}</span>
    </span>
  );
}

export function IncapacidadBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  const Icon = HeartPulse;
  const label = "Incapacidad";

  if (iconOnly) {
    return (
      <Tooltip content={label}>
        <span className={`status-badge status-badge--incapacidad status-badge--icon-only ${className}`.trim()} aria-label={label} role="img">
          <Icon size={14} className="status-badge__icon" aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={`status-badge status-badge--incapacidad ${className}`.trim()}>
      <Icon size={14} className="status-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function ProximoIngresoBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  const Icon = CalendarClock;
  const label = "Próximo ingreso";

  if (iconOnly) {
    return (
      <Tooltip content={label}>
        <span className={`status-badge status-badge--proximo-ingreso status-badge--icon-only ${className}`.trim()} aria-label={label} role="img">
          <Icon size={14} className="status-badge__icon" aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={`status-badge status-badge--proximo-ingreso ${className}`.trim()}>
      <Icon size={14} className="status-badge__icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
