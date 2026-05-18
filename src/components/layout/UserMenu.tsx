import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import './UserMenu.css';

/**
 * Dropdown ghost que reemplaza el chip de usuario + botón de logout
 * standalone. Trigger: círculo con inicial + chevron. Al abrir muestra el
 * username completo y un botón "Cerrar sesión" alineado a la izquierda.
 *
 * Se cierra al hacer click fuera o presionar Escape.
 */
export function UserMenu() {
  const { username, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Click outside + Escape para cerrar.
  useEffect(() => {
    if (!open) return;

    function onPointer(e: PointerEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  if (!username) return null;

  const initial = username.charAt(0).toUpperCase() || '·';

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Sesión de ${username}`}
        title={username}
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {initial}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`user-menu__chevron${open ? ' user-menu__chevron--open' : ''}`}
        />
      </button>

      {open && (
        <div
          className="user-menu__dropdown"
          role="menu"
          aria-label="Menú de sesión"
        >
          <div className="user-menu__header">
            <p className="user-menu__label">Sesión activa</p>
            <p className="user-menu__name" title={username}>
              {username}
            </p>
          </div>
          <div className="user-menu__divider" role="separator" />
          <button
            type="button"
            className="user-menu__item"
            onClick={toggleTheme}
            role="menuitemradio"
            aria-checked={theme === 'dark'}
            aria-label={
              theme === 'dark'
                ? 'Cambiar a tema claro'
                : 'Cambiar a tema oscuro'
            }
          >
            {theme === 'dark' ? (
              <Sun size={14} aria-hidden="true" />
            ) : (
              <Moon size={14} aria-hidden="true" />
            )}
            <span className="user-menu__item-label">Tema</span>
            <span className="user-menu__item-meta">
              {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          </button>
          {/* Item "Configuración" deshabilitado temporalmente.
              Cuando se retome el acceso al panel admin, restaurar el botón
              gateado por `isAdmin` (profile?.role === 'admin') y la ruta
              /settings en App.tsx. */}
          <div className="user-menu__divider" role="separator" />
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            onClick={handleSignOut}
            disabled={signingOut}
            role="menuitem"
          >
            <LogOut size={14} aria-hidden="true" />
            <span className="user-menu__item-label">
              {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
