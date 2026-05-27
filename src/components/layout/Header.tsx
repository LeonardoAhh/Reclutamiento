import { NavLink } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import './Header.css';

const NAV_ITEMS: ReadonlyArray<{
  to: string;
  label: string;
  end?: boolean;
}> = [
  { to: '/',          label: 'KPIs',       end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pipeline',  label: 'Candidatos' },
  { to: '/vacantes',  label: 'Vacantes' },
  { to: '/bajas',     label: 'Bajas' },
];

export function Header() {
  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner container">

        {/* Brand */}
        <div className="app-header__brand" aria-hidden="true">
          <span className="app-header__brand-dot" />
          <span className="app-header__title">Reclutamiento</span>
        </div>

        {/* Nav principal */}
        <nav className="app-header__nav" aria-label="Navegación principal">
          <ul className="app-header__nav-list" role="list">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `app-header__nav-item${isActive ? ' app-header__nav-item--active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Acciones */}
        <div className="app-header__actions">
          <UserMenu />
        </div>

      </div>
    </header>
  );
}