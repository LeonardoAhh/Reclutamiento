import { CalendarClock, HeartPulse, LifeBuoy, Star, UsersRound, type LucideIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import './Badge.css';

export type BadgeVariant =
  | 'neutral'
  | 'neutral-solid'
  | 'warning'
  | 'success'
  | 'error'
  | 'error-solid'
  | 'default'
  | 'coral'
  | 'teal'
  | 'amber';

export type BadgeSize = 'regular' | 'compact' | 'icon';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

type BadgeTone = 'neutral' | 'neutral-solid' | 'warning' | 'success' | 'error' | 'error-solid';
const VARIANT_TONE: Record<BadgeVariant, BadgeTone> = {
  neutral: 'neutral',
  'neutral-solid': 'neutral-solid',
  warning: 'warning',
  success: 'success',
  error: 'error',
  'error-solid': 'error-solid',
  default: 'neutral',
  coral: 'neutral',
  teal: 'neutral',
  amber: 'warning',
};

export function Badge({ children, variant = 'default', size = 'regular', className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge--${VARIANT_TONE[variant]} badge--${size} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

type StatusIconKind = 'starlite' | 'plantilla' | 'backup' | 'incapacidad' | 'proximo-ingreso';

interface StatusIconBadgeProps {
  kind: StatusIconKind;
  label: string;
  icon: LucideIcon;
  iconOnly?: boolean;
  className?: string;
  variant?: BadgeVariant;
}

function StatusIconBadge({
  kind,
  label,
  icon: Icon,
  iconOnly = false,
  className = '',
  variant = 'neutral',
}: StatusIconBadgeProps) {
  const badge = (
    <Badge
      variant={variant}
      size={iconOnly ? 'icon' : 'compact'}
      className={`status-badge status-badge--${kind} ${className}`.trim()}
      role={iconOnly ? 'img' : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      <Icon className="status-badge__icon" aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </Badge>
  );
  return iconOnly ? <Tooltip content={label}>{badge}</Tooltip> : badge;
}

export function StarliteBadge({ compact = false }: { compact?: boolean } = {}) {
  return <StatusIconBadge kind="starlite" label="Starlite" icon={Star} iconOnly={compact} />;
}

export function VinoplasticBadge() {
  return (
    <Tooltip content="ViñoPlastic">
      <Badge variant="neutral" size="compact" className="project-badge">
        ViñoPlastic
      </Badge>
    </Tooltip>
  );
}

interface RoleBadgeProps {
  role?: string;
  label?: string;
}

export function RoleBadge({ role = 'default', label }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase();
  const badgeRole =
    normalizedRole === 'admin' || normalizedRole === 'administrador'
      ? 'admin'
      : normalizedRole === 'reclutador' || normalizedRole === 'reclutadora'
        ? 'reclutador'
        : 'default';
  return (
    <Badge variant="neutral" size="compact" className="role-badge" data-role={badgeRole}>
      <span className="role-badge__dot" aria-hidden="true" />
      {label || role}
    </Badge>
  );
}

export { ReclutadorBadge, getReclutadorMeta } from './ReclutadorBadge';
export type { ReclutadorBadgeProps } from './ReclutadorBadge';

interface StatusBadgeProps {
  iconOnly?: boolean;
  className?: string;
}

export function PlantillaBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  return (
    <StatusIconBadge kind="plantilla" label="Plantilla" icon={UsersRound} iconOnly={iconOnly} className={className} />
  );
}

export function BackupBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  return <StatusIconBadge kind="backup" label="Backup" icon={LifeBuoy} iconOnly={iconOnly} className={className} />;
}

export interface AreaStatusBadgeProps {
  type: 'proceso' | 'ingreso' | 'sin_proceso';
  count?: number;
}

export function AreaStatusBadge({ type, count }: AreaStatusBadgeProps) {
  const label = type === 'proceso' ? 'Proceso' : type === 'ingreso' ? 'Ingreso' : 'Sin proceso';
  return (
    <Badge
      variant={type === 'sin_proceso' ? 'error' : 'warning'}
      size="compact"
      className={`status-badge status-badge--${type === 'sin_proceso' ? 'sin-proceso' : type}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span>
        {label}
        {count !== undefined && count > 0 ? ` (${count})` : ''}
      </span>
    </Badge>
  );
}

export function IncapacidadBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  return (
    <StatusIconBadge
      kind="incapacidad"
      label="Incapacidad"
      icon={HeartPulse}
      iconOnly={iconOnly}
      className={className}
      variant="warning"
    />
  );
}

export function ProximoIngresoBadge({ iconOnly = false, className = '' }: StatusBadgeProps) {
  return (
    <StatusIconBadge
      kind="proximo-ingreso"
      label="Próximo ingreso"
      icon={CalendarClock}
      iconOnly={iconOnly}
      className={className}
    />
  );
}
