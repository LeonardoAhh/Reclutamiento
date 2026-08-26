import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronsLeft,
  Menu,
  ChevronDown,
  ChevronUp,
  Loader,
  LogOut,
} from "lucide";
import { ImagePlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Tooltip } from "@/components/ui/Tooltip";
import "./Sidebar.css";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { useFeedback } from "@/hooks/useFeedback";
import { useLoader } from "@/hooks/useLoader";

import { NAV_GROUPS } from "./navigation";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
};

/**
 * Sidebar de escritorio (>=1024px). Fija a la izquierda, colapsable a iconos.
 * Construida 100% con design tokens: canvas + hairline, sin sombras pesadas.
 * Nota: El menú de usuario se ha movido al Header.
 */
export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileMenuOpen,
  onCloseMobileMenu,
}: SidebarProps) {
  const { username, profile, signOut } = useAuth();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuPopoverRef = useRef<HTMLDivElement | null>(null);
  const userMenuInitialFocusRef = useRef<"first" | "last">("first");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const loader = useLoader();
  const { version } = useSystemVersion();
  const { trigger } = useFeedback();

  /* Cerrar menú móvil al navegar */
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);
  if (!username) return null;

  // Mantener el patrón de teclado del menú y cerrarlo al salir de él.
  useEffect(() => {
    if (!menuOpen) return;
    const getMenuItems = () =>
      userMenuPopoverRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      ) ?? [];
    const focusFrame = requestAnimationFrame(() => {
      const items = getMenuItems();
      const target =
        userMenuInitialFocusRef.current === "last"
          ? items[items.length - 1]
          : items[0];
      target?.focus();
    });
    const onPointerDown = (e: PointerEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const items = Array.from(getMenuItems());
      if (items.length === 0 || !userMenuPopoverRef.current?.contains(document.activeElement)) {
        return;
      }

      e.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "Home") {
        items[0].focus();
      } else if (e.key === "End") {
        items[items.length - 1].focus();
      } else {
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (currentIndex + direction + items.length) % items.length;
        items[nextIndex].focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    trigger("light");
    loader.flash({
      title: "Cerrando sesión...",
      duration: 2500,
    });
    try {
      trigger("success");
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }, [signingOut, signOut, trigger, loader]);

  return (
    <aside
      className="sidebar"
      data-collapsed={collapsed && !mobileMenuOpen}
      data-mobile-open={mobileMenuOpen}
      aria-label="Navegación principal"
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      {/* Top: colapsar */}
      <div className="sidebar__top">
        <button
          type="button"
          className="sidebar__item sidebar__collapse-btn"
          onClick={() => {
            if (mobileMenuOpen && onCloseMobileMenu) {
              onCloseMobileMenu();
            } else {
              onToggleCollapse();
            }
          }}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          data-testid="sidebar-collapse-toggle"
        >
          <MorphingIcon
            icon={collapsed ? Menu : ChevronsLeft}
            size={20}
            className="sidebar__item-icon"
          />
          <span className="sidebar__item-label">Colapsar</span>
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav" aria-label="Secciones">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="sidebar__group">
            {group.title && !collapsed && (
              <div className="sidebar__group-title">{group.title}</div>
            )}
            <ul className="sidebar__list" role="list" aria-label={group.title || "Principal"}>
              {group.items.map(({ to, label, icon: Icon, end }) => {
                const isActive = end
                  ? location.pathname === to
                  : location.pathname.startsWith(to);

                const link = (
                  <NavLink
                    to={to}
                    end={end}
                    className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                    aria-label={label}
                    data-testid={`sidebar-nav-${to.replace("/", "") || "kpis"}`}
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="sidebar__item-icon"
                    />
                    <span className="sidebar__item-label">{label}</span>
                  </NavLink>
                );

                return (
                  <li key={to}>
                    {collapsed ? (
                      <Tooltip content={label} side="right" delayMs={0}>
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: user avatar + menu (moved from header) */}
      <div className="sidebar__footer" ref={userMenuRef}>
        <div className="sidebar__user">
          <button
            ref={triggerRef}
            id="sidebar-user-menu-trigger"
            type="button"
            className="sidebar__user-trigger"
            onClick={() => {
              userMenuInitialFocusRef.current = "first";
              setMenuOpen((s) => !s);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              userMenuInitialFocusRef.current =
                event.key === "ArrowUp" ? "last" : "first";
              setMenuOpen(true);
            }}
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? "sidebar-user-menu-popover" : undefined}
            aria-haspopup="menu"
            aria-label="Opciones de usuario"
          >
            <Avatar name={username} src={profile?.avatar_url} size={32} />
            <MorphingIcon
              icon={menuOpen ? ChevronUp : ChevronDown}
              size={14}
              className="sidebar__user-icon"
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={userMenuPopoverRef}
                id="sidebar-user-menu-popover"
                role="menu"
                aria-labelledby="sidebar-user-menu-trigger"
                className="app-header__popover"
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : -8,
                  scale: shouldReduceMotion ? 1 : 0.98,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : -8,
                  scale: shouldReduceMotion ? 1 : 0.98,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.16,
                  ease: "easeOut",
                }}
              >
                <div className="app-header__popover-header">
                  <span className="app-header__session-name" title={username}>
                    {username}
                  </span>
                  {version && (
                    <span className="app-header__popover-version">
                      v{version}
                    </span>
                  )}
                </div>

                <div className="app-header__popover-divider" />

                <div className="app-header__popover-actions">
                  <button
                    type="button"
                    role="menuitem"
                    className="app-header__popover-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setModalOpen(true);
                    }}
                  >
                    <span>Avatar</span>
                    <ImagePlus
                      size={16}
                      className="app-header__popover-icon"
                      aria-hidden="true"
                    />
                  </button>

                  <div className="app-header__popover-row">
                    <span className="app-header__popover-row-label">Tema</span>
                    <ThemeToggle />
                  </div>

                  <div className="app-header__popover-divider" />

                  <button
                    type="button"
                    role="menuitem"
                    className="app-header__popover-item app-header__popover-item--danger"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <MorphingIcon
                      icon={signingOut ? Loader : LogOut}
                      size={16}
                      className={`app-header__popover-icon${signingOut ? " app-header__spin" : ""}`}
                      aria-hidden="true"
                    />
                    <span>{signingOut ? "Cerrando..." : "Cerrar sesión"}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AvatarUploadModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </aside>
  );
}
