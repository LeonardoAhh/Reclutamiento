import * as AvatarPrimitive from '@radix-ui/react-avatar';
import './Avatar.css';

type AvatarProps = {
  /** El nombre de usuario o correo para derivar las iniciales y el color. */
  name: string;
  /** URL de la imagen del avatar. */
  src?: string | null;
};

/** Extrae hasta 2 iniciales (ej. leonardo@mail.com -> LE, Juan Perez -> JP). */
function getInitials(name: string) {
  const base = (name.split('@')[0] ?? '').trim();
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/**
 * Avatar UI
 * Muestra una imagen si src carga correctamente. Radix gestiona el fallback
 * accesible; sin imagen, las iniciales usan la superficie neutral del sistema.
 */
export function Avatar({ name, src }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className="ui-avatar"
      aria-hidden="true"
      title={name}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="ui-avatar__img"
        />
      )}
      <AvatarPrimitive.Fallback className="ui-avatar__fallback">
        {getInitials(name) || 'U'}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
