import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Header.css';

const NAV_GROUPS = [
  {
    label: 'Datos',
    items: [
      { to: '/',          label: 'KPIs', end: true },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/reporte-diario', label: 'Reporte Diario' },
    ]
  },
  {
    label: 'Procesos',
    items: [
      { to: '/pipeline',  label: 'Candidatos' },
      { to: '/vacantes',  label: 'Vacantes' },
      { to: '/toulouse',  label: 'Toulouse-Piéron' },
    ]
  },
  {
    label: 'Equipo',
    items: [
      { to: '/empleados', label: 'Empleados' },
      { to: '/rutas',     label: 'Rutas' },
    ]
  }
];

function NavDropdown({ label, items }: { label: string, items: { to: string, label: string, end?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <li className="app-header__nav-group">
      <button 
        ref={triggerRef}
        type="button"
        className={`app-header__nav-item app-header__nav-dropdown-trigger ${open ? 'app-header__nav-dropdown-trigger--open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={14} className={`app-header__nav-chevron ${open ? 'app-header__nav-chevron--open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="app-header__dropdown-menu" role="menu" ref={menuRef}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-header__dropdown-item ${isActive ? 'app-header__dropdown-item--active' : ''}`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </li>
  );
}

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
          <span className="app-header__brand-mark" aria-hidden="true" />
          <span className="app-header__brand-text">Reclutamiento</span>
        </NavLink>

        {/* Nav principal */}
        <nav className="app-header__nav" aria-label="Navegación principal">
          <ul className="app-header__nav-list" role="list">
            {NAV_GROUPS.map((group) => (
              <NavDropdown key={group.label} label={group.label} items={group.items} />
            ))}
          </ul>
        </nav>

        {/* Acciones */}
        <div className="app-header__actions">
          <ThemeToggle />
          <UserMenu />
        </div>

      </div>
    </header>
  );
}