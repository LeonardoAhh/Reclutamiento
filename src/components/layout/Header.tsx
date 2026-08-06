import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader, LogOut } from 'lucide';
import { ImagePlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { useFeedback } from '@/hooks/useFeedback';
import { useLoader } from '@/hooks/useLoader';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarUploadModal } from '@/components/ui/AvatarUploadModal';
import { NAV_ITEMS } from './navigation';
import './Header.css';

import { Menu } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

/**
 * Header principal de la aplicación.
 *  - Muestra el título de la página actual.
 *  - En móvil (<1024px): Muestra el Brand y menú hamburguesa.
 *  - En PC (>=1024px): El Brand se oculta (está en el Sidebar).
 */
export function Header({ onMobileMenuToggle }: HeaderProps = {}) {
  const { username, profile, signOut } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const loader = useLoader();
  const { version } = useSystemVersion();
  const { trigger } = useFeedback();
  const location = useLocation();

  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentNavItem = useMemo(() => NAV_ITEMS.find((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  }), [location.pathname]);

  let pageTitle = currentNavItem ? currentNavItem.label : '';
  if (!pageTitle) {
    if (location.pathname.startsWith('/bajas')) pageTitle = 'Downsizing';
    else if (location.pathname.startsWith('/transporte')) pageTitle = 'Transporte';
    else if (location.pathname.startsWith('/configuracion')) pageTitle = 'Configuración';
  }

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  // Manejo de foco para el popover de usuario
  useEffect(() => {
    if (menuOpen) {
      requestAnimationFrame(() => {
        const popover = document.getElementById('header-user-menu-popover');
        const firstAction = popover?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstAction?.focus();
      });
    }
  }, [menuOpen]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    trigger('light');
    loader.flash({ title: 'Cerrando sesión...', hint: 'Nos vemos pronto', duration: 2500 });
    try {
      trigger('success');
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }, [signingOut, signOut, trigger, loader]);

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          {/* Menú de hamburguesa (solo móvil) */}
          {onMobileMenuToggle && (
            <button
              type="button"
              className="app-header__mobile-menu-btn"
              onClick={onMobileMenuToggle}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          )}

          {pageTitle && (
            <h1 className="app-header__page-title">{pageTitle}</h1>
          )}
        </div>

        {/* Espaciador flexible para empujar el menú a la derecha */}
        <div style={{ flex: 1 }} />

        {/* Acciones: Menú de Usuario */}
        {username && (
          <div 
            className="app-header__actions" 
            ref={userMenuRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && menuOpen) {
                setMenuOpen(false);
                document.getElementById('header-user-menu-trigger')?.focus();
              }
            }}
          >
            <button
              id="header-user-menu-trigger"
              type="button"
              className="app-header__user-trigger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "header-user-menu-popover" : undefined}
              aria-haspopup="menu"
              aria-label="Opciones de usuario"
            >
              <Avatar name={username} src={profile?.avatar_url} size={32} />
              <MorphingIcon
                icon={menuOpen ? ChevronUp : ChevronDown}
                size={16}
                className="app-header__trigger-icon"
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  id="header-user-menu-popover"
                  className="app-header__popover"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10, scale: shouldReduceMotion ? 1 : 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10, scale: shouldReduceMotion ? 1 : 0.95 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
                >
                  <div className="app-header__popover-header">
                    <span className="app-header__session-name" title={username}>{username}</span>
                    {version && (
                      <span className="app-header__popover-version">v{version}</span>
                    )}
                  </div>
                  
                    <div className="app-header__popover-divider" />
                  
                  <div className="app-header__popover-actions">
                    <button
                      type="button"
                      className="app-header__popover-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setModalOpen(true);
                      }}
                    >
                      <ImagePlus size={16} className="app-header__popover-icon" aria-hidden="true" />
                      <span>Cambiar foto de perfil</span>
                    </button>

                    <div className="app-header__popover-row">
                      <span className="app-header__popover-row-label">
                        Tema visual
                      </span>
                      <ThemeToggle />
                    </div>

                    <div className="app-header__popover-divider" />

                    <button
                      type="button"
                      className="app-header__popover-item app-header__popover-item--danger"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      <MorphingIcon
                        icon={signingOut ? Loader : LogOut}
                        size={16}
                        className={`app-header__popover-icon${signingOut ? ' app-header__spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{signingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AvatarUploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  );
}
