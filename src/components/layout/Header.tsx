import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Header.css';

const NAV_ITEMS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pipeline', label: 'Candidatos' },
  { to: '/vacantes', label: 'Vacantes' },
];

export function Header() {
  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner container">
        <div className="app-header__brand">
          <span className="app-header__mark" aria-hidden="true">*</span>
          <span className="app-header__title">Reclutamiento</span>
        </div>
        <nav className="app-header__nav" aria-label="Navegación principal">
          <ul className="app-header__nav-list">
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
