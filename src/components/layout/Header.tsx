import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// @ts-ignore
import Avatar from 'boring-avatars';
import { BrandLogo } from '@/components/ui/BrandLogo';
import './Header.css';

/**
 * Header superior — solo móvil/tablet (<1024px).
 * Brand a la izquierda + Avatar simple a la derecha.
 * La navegación y configuraciones viven en el BottomTabBar.
 */
export function Header() {
  const { username } = useAuth();

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
              {/* @ts-ignore */}
              <Avatar 
                size={32} 
                name={username} 
                variant="beam" 
                colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']} 
              />
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
