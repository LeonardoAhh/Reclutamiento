import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import './Header.css';

const NAV_ITEMS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pipeline', label: 'Candidatos' },
  { to: '/vacantes', label: 'Vacantes' },
];

export function Header() {
  const { username, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

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
          {username && (
            <div className="app-header__user" aria-label="Sesión activa">
              <span className="app-header__user-name" title={username}>
                {username}
              </span>
              <button
                type="button"
                className="app-header__logout"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
