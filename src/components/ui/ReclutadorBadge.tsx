import React from 'react';
import { CircleCheckBig, ChevronDown, Crown, UserRound } from 'lucide-react';
import { Tooltip } from './Tooltip';
import {
  RECLUTADORES_INFO,
  type ReclutadorNombre,
  type ReclutadorRol,
} from '@/lib/constants';

export interface ReclutadorBadgeProps {
  /** Nombre del reclutador o coordinador (ej. 'ALEXANDRA', 'DANIELA', 'LEONARDO' o minúsculas/TitleCase) */
  nombre: string;
  /** Variante de visualización: 'default' (ícono + texto) o 'icon-only' (solo ícono minimalista) */
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

export function getReclutadorMeta(nombre: string): {
  key: string;
  nombreFormateado: string;
  rol: ReclutadorRol;
  labelRol: string;
} {
  const key = nombre.trim().toUpperCase();
  const info = RECLUTADORES_INFO[key as ReclutadorNombre];

  const rol: ReclutadorRol = info
    ? info.rol
    : key === 'LEONARDO'
    ? 'coordinador'
    : 'reclutadora';

  const nombreFormateado = nombre
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
 * de RECLUTADORES_ACTIVOS ('ALEXANDRA', 'DANIELA', 'LEONARDO').
 *
 * Versiones:
 * 1. Ícono + Texto (default): Muestra el punto decorativo, ícono, nombre y opcionalmente el rol.
 * 2. Solo Ícono (`iconOnly` o `variant="icon-only"`): Versión minimalista de tamaño compacto solo con el ícono y tooltip.
 *
 * Diferencia visualmente:
 * - Reclutadoras (Alexandra, Daniela): Tono Teal (`var(--color-accent-teal)`) e ícono `UserRound`.
 * - Coordinador (Leonardo): Tono Purple (`var(--color-accent-purple)`) e ícono `Crown`.
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
  if (!nombre) return null;

  const isIconOnly = iconOnly || variant === 'icon-only';

  const { key, nombreFormateado, rol, labelRol } = getReclutadorMeta(nombre);
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
        <span className="reclutador-badge__role-tag">{labelRol}</span>
      )}
      {showCaret && (
        <ChevronDown size={14} className="reclutador-badge__caret" aria-hidden="true" style={{ opacity: 0.6, marginLeft: 2 }} />
      )}
    </span>
  );
}
