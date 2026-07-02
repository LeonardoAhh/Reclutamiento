import { NavLink } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Header.css';
import { BrandLogo } from '@/components/ui/BrandLogo';

/**
 * Header superior — solo móvil/tablet (<1024px).
 * Brand a la izquierda + acciones (tema, usuario) a la derecha.
 * La navegación vive en el BottomTabBar (móvil/tablet) o Sidebar (desktop,
 * donde este header se oculta por completo).
 */
export function Header() {
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
        <div className="app-header__actions">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
