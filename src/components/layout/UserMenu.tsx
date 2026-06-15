import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Moon, Sun, Users, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { useTheme } from '@/hooks/useTheme';
import './UserMenu.css';

/**
 * Dropdown de sesión. Trigger: avatar inicial + chevron.
 * Se cierra con click fuera o Escape; el foco regresa
 * al trigger para mantener el flujo de teclado.
 *
 * TODO(admin): restaurar ítem "Configuración" cuando
 * /settings esté disponible; gatearlo por isAdmin.
 */
export function UserMenu() {
  const { username, signOut } = useAuth();
  const { show, hide } = useLoader();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen]             = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* close como ref para que handleSignOut no necesite
     redeclararse cuando cambia el estado open. */
  const closeRef = useRef(() => {
    setOpen(false);
    triggerRef.current?.focus();
  });

  /* ── Cierre por click fuera y Escape ─────── */
  useEffect(() => {
    if (!open) return;

    const close = closeRef.current;

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    
    // Parse the username to display only the first part in uppercase
    const displayName = username ? username.split('@')[0].toUpperCase() : '';
    show({ tone: 'logout', title: displayName });
    
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      closeRef.current();
      // El overlay motivacional de logout dura 10 segundos.
      window.setTimeout(hide, 10000);
    }
  }, [signingOut, signOut, show, hide, username]);
  /* Sin dependencia de close: closeRef es estable entre renders. */

  if (!username) return null;

  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="user-menu" ref={rootRef}>

      {/* ── Trigger ──────────────────────────── */}
      <button
        ref={triggerRef}
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
          size={12}
          aria-hidden="true"
          className={`user-menu__chevron${open ? ' user-menu__chevron--open' : ''}`}
        />
      </button>

      {/* ── Dropdown ─────────────────────────── */}
      {open && (
        <div
          className="user-menu__dropdown"
          role="menu"
          aria-label="Menú de sesión"
        >
          <div className="user-menu__header">
            <p className="user-menu__label">Active session</p>
            <p className="user-menu__name" title={username}>
              {username}
            </p>
          </div>

          <div className="user-menu__divider" role="separator" />

          <button
            type="button"
            className="user-menu__item"
            onClick={() => {
              closeRef.current();
              navigate('/empleados');
            }}
            role="menuitem"
          >
            <Users size={13} aria-hidden="true" />
            <span className="user-menu__item-label">Employees</span>
          </button>

          <button
            type="button"
            className="user-menu__item"
            onClick={() => {
              closeRef.current();
              navigate('/rutas');
            }}
            role="menuitem"
          >
            <Map size={13} aria-hidden="true" />
            <span className="user-menu__item-label">Rutas</span>
          </button>

          <div className="user-menu__divider" role="separator" />

          <button
            type="button"
            className="user-menu__item"
            onClick={toggleTheme}
            role="menuitemradio"
            aria-checked={theme === 'dark'}
            aria-label={
              theme === 'dark' ? 'Change to light theme' : 'Switch to dark theme'
            }
          >
            {theme === 'dark'
              ? <Sun  size={13} aria-hidden="true" />
              : <Moon size={13} aria-hidden="true" />
            }
            <span className="user-menu__item-label">Theme</span>
            <span className="user-menu__item-meta">
              {theme === 'dark' ? 'dark' : 'light'}
            </span>
          </button>

          <div className="user-menu__divider" role="separator" />

          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            onClick={handleSignOut}
            disabled={signingOut}
            role="menuitem"
          >
            <LogOut size={13} aria-hidden="true" />
            <span className="user-menu__item-label">
              {signingOut ? 'Closing…' : 'Sign out'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
