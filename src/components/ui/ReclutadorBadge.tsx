import { ChevronDown, Crown, UserRound } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { findTeamMember, type TeamMember, type RecruiterRole } from '@/features/team/types';
import './Badge.css';

export interface ReclutadorBadgeProps {
  /** Nombre o variante del integrante, conservado en los registros. */
  nombre: string;
  /** Variante de visualización: badge o solo ícono. */
  variant?: 'default' | 'icon-only';
  /** Acceso rápido para la variante solo ícono */
  iconOnly?: boolean;
  /** Mostrar explícitamente la etiqueta de rol ("Reclutadora" / "Coordinador") — solo aplica en variante con texto */
  showRole?: boolean;
  /** Tamaño del badge ('sm' | 'md') */
  size?: 'sm' | 'md';
  /** Si es true, muestra el ícono representativo (UserRound para Reclutadora, Crown para Coordinador). Por defecto true */
  showIcon?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Mostrar icono de flecha hacia abajo (para cuando se usa como trigger de dropdown) */
  showCaret?: boolean;
}

export function getReclutadorMeta(nombre: string, members: readonly TeamMember[] = []): {
  key: string;
  nombreFormateado: string;
  rol: RecruiterRole;
  labelRol: string;
} {
  const info = findTeamMember(members, nombre);
  const key = info?.canonical_name ?? nombre.trim().toUpperCase();

  const rol: RecruiterRole = info?.badge_role ?? 'reclutadora';

  const nombreFormateado = info?.short_name ?? nombre
    .trim()
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const labelRol = rol === 'coordinador' ? 'Coordinador' : 'Reclutadora';

  return {
    key,
    nombreFormateado,
    rol,
    labelRol,
  };
}

/**
 * ReclutadorBadge — Componente reutilizable para visualizar reclutadoras y coordinadores
 * del catálogo administrable del equipo.
 *
 * Versiones:
 * 1. Ícono + Texto (default): Muestra el ícono, nombre y opcionalmente el rol.
 * 2. Solo Ícono (`iconOnly` o `variant="icon-only"`): Versión minimalista de tamaño compacto solo con el ícono y tooltip.
 *
 * El color se limita al ícono para conservar la superficie neutral y el
 * borde hairline del sistema visual.
 */
export function ReclutadorBadge({
  nombre,
  variant,
  iconOnly = false,
  showRole = false,
  size = 'md',
  showIcon = true,
  showCaret = false,
  className = '',
}: ReclutadorBadgeProps) {
  const { language } = useLanguage();
  const { members } = useTeamDirectory();
  if (!nombre) return null;

  const isIconOnly = iconOnly || variant === 'icon-only';

  const { key, nombreFormateado, rol, labelRol } = getReclutadorMeta(nombre, members);
  const isCoordinador = rol === 'coordinador';

  const IconComponent = isCoordinador ? Crown : UserRound;
  const titleText = nombreFormateado;

  if (isIconOnly) {
    return (
      <Tooltip content={titleText}>
        <span
          className={`reclutador-badge reclutador-badge--${rol} reclutador-badge--person-${key.toLowerCase()} reclutador-badge--${size} reclutador-badge--icon-only ${className}`.trim()}
          aria-label={titleText}
          role="img"
        >
          <IconComponent
            size={size === 'sm' ? 12 : 14}
            className="reclutador-badge__icon"
            aria-hidden="true"
          />
        </span>
      </Tooltip>
    );
  }

  return (
    <span
      className={`reclutador-badge reclutador-badge--${rol} reclutador-badge--person-${key.toLowerCase()} reclutador-badge--${size} ${className}`.trim()}
    >
      {showIcon && (
        <IconComponent
          size={size === 'sm' ? 12 : 14}
          className="reclutador-badge__icon"
          aria-hidden="true"
        />
      )}
      <span className="reclutador-badge__name">{nombreFormateado}</span>
      {showRole && (
        <span className="reclutador-badge__role-tag">{language === 'en' ? (isCoordinador ? 'Coordinator' : 'Recruiter') : labelRol}</span>
      )}
      {showCaret && (
        <ChevronDown className="reclutador-badge__caret" aria-hidden="true" />
      )}
    </span>
  );
}
