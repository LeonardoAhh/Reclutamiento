import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/ui/BrandLogo';
import './Header.css';

/**
 * Header superior — solo móvil/tablet (<1024px).
 * Brand a la izquierda + Avatar simple a la derecha.
 * La navegación y configuraciones viven en el BottomTabBar.
 */
export function Header() {
  const { username } = useAuth();

  const userInitials = useMemo(() => {
    if (!username) return '';
    const base = username.split('@')[0] ?? '';
    const parts = base.split(/[._\-\s]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }, [username]);

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner container">
        {/* Brand */}
        <NavLink
          to="/"
          className="app-header__brand"
          aria-label="Reclutamiento, ir al inicio"
        >
          <BrandLogo size={26} />
        </NavLink>

        {/* Acciones */}
        {username && (
          <div className="app-header__actions">
            <span className="app-header__avatar" aria-hidden="true" title={username}>
              {userInitials || 'U'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
