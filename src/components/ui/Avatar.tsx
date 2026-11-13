import type { ReactNode } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import './Avatar.css';

type AvatarProps = {
  /** El nombre de usuario o correo para derivar las iniciales y el color. */
  name: string;
  /** URL de la imagen del avatar. */
  src?: string | null;
  /** Contenido alternativo cuando no hay una imagen disponible. */
  fallback?: ReactNode;
  title?: string;
};

/** Extrae hasta 2 iniciales (ej. leonardo@mail.com -> LE, Juan Perez -> JP). */
function getInitials(name: string) {
  const base = (name.split('@')[0] ?? '').trim();
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

const avatarTones = ['neutral', 'warning', 'success', 'error', 'identity'] as const;

function getAvatarTone(name: string): (typeof avatarTones)[number] {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return 'neutral';

  let hash = 0;
  for (const character of normalizedName) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }

  return avatarTones[hash % avatarTones.length];
}

/**
 * Avatar UI
 * Muestra una imagen si src carga correctamente. Radix gestiona el fallback
 * accesible; sin imagen, las iniciales usan un tono decorativo estable por nombre.
 */
export function Avatar({ name, src, fallback, title = name }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className="ui-avatar" data-tone={getAvatarTone(name)} aria-hidden="true" title={title}>
      {src && <AvatarPrimitive.Image src={src} alt="" className="ui-avatar__img" />}
      <AvatarPrimitive.Fallback className="ui-avatar__fallback">
        {fallback ?? (getInitials(name) || 'U')}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
