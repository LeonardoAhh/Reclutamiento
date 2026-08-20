import { useMemo, useState } from 'react';
import './Avatar.css';

type AvatarProps = {
  /** El nombre de usuario o correo para derivar las iniciales y el color. */
  name: string;
  /** URL de la imagen del avatar. */
  src?: string | null;
  /** Tamaño del avatar en píxeles. Por defecto 32px. */
  size?: number;
};

/**
 * Paleta de gradientes deterministas construida EXCLUSIVAMENTE 
 * con los tokens autorizados de la paleta "sticker" (desing.md).
 */
const GRADIENTS = [
  'linear-gradient(135deg, var(--color-accent-orange) 0%, var(--color-accent-amber, #f59e0b) 100%)',
  'linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-sky) 100%)',
  'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-sky) 100%)',
  'linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-green, #1aae39) 100%)',
  'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-orange) 100%)',
];

/** Hash simple para elegir siempre el mismo gradiente para el mismo string. */
function getGradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

/** Extrae hasta 2 iniciales (ej. leonardo@mail.com -> LE, Juan Perez -> JP). */
function getInitials(name: string) {
  const base = name.split('@')[0] ?? '';
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/**
 * Avatar UI
 * Muestra una imagen si src es proporcionado y carga correctamente.
 * Si no hay src o la imagen falla, muestra iniciales sobre un gradiente de fondo.
 */
export function Avatar({ name, src, size = 32 }: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const background = useMemo(() => getGradientForName(name), [name]);
  const [imageError, setImageError] = useState(false);

  const showImage = src && !imageError;

  return (
    <span
      className="ui-avatar"
      aria-hidden="true"
      title={name}
      style={{
        width: size,
        height: size,
        background: showImage ? 'var(--color-surface-soft)' : background,
        fontSize: Math.max(10, size * 0.4),
      }}
    >
      {showImage ? (
        <img 
          src={src} 
          alt={name}
          className="ui-avatar__img"
          onError={() => setImageError(true)}
        />
      ) : (
        initials || 'U'
      )}
    </span>
  );
}
