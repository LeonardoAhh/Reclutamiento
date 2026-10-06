import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Avatar } from "@/components/ui/Avatar";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { ACCOUNT_PATH, LOGOUT_PATH } from "./navigation";
import { Eclipse, Languages, UserRound } from "lucide-react";
import { ChevronsUpDown, LogOut } from "lucide";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import "./UserMenuPopover.css";

interface UserMenuPopoverProps {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  mobile: boolean;
  onNavigate?: () => void;
}

export function UserMenuPopover({
  displayName,
  email,
  avatarUrl,
  mobile,
  onNavigate,
}: UserMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, storageError: languageStorageError } = useLanguage();
  const { resolvedTheme, storageError: themeStorageError, setPreference } = useTheme();
  const english = language === "en";
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const themeActionLabel = english
    ? nextTheme === "dark" ? "Switch to dark theme" : "Switch to light theme"
    : nextTheme === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro";
  const languageActionLabel = english ? "Switch language to Spanish" : "Cambiar idioma a inglés";

  return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="sidebar__user-trigger"
            aria-label={english
              ? `Open options for ${displayName}${email ? `, ${email}` : ""}`
              : `Abrir opciones de ${displayName}${email ? `, ${email}` : ""}`}
          >
            <Avatar name={displayName} src={avatarUrl} />
            <span className="sidebar__user-identity" aria-hidden="true">
              <span className="sidebar__user-name">{displayName}</span>
              {email && <span className="sidebar__user-email">{email}</span>}
            </span>
            <MorphingIcon
              icon={ChevronsUpDown}
              className="sidebar__user-icon"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={mobile ? "start" : "end"}
          side={mobile ? "top" : "right"}
          className="user-menu-popover"
          aria-label={english ? "User options" : "Opciones de usuario"}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              onSelect={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Link to={ACCOUNT_PATH} className="user-menu-popover__item">
                <UserRound
                  className="user-menu-popover__icon"
                  aria-hidden="true"
                />
                <span>{english ? "Account" : "Cuenta"}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <div
            className="user-menu-popover__preferences"
            role="group"
            aria-label={english ? "Appearance and language" : "Apariencia e idioma"}
          >
            <DropdownMenuItem
              className="user-menu-popover__preference"
              aria-label={themeActionLabel}
              data-mode={resolvedTheme}
              title={themeActionLabel}
              onSelect={(event) => {
                event.preventDefault();
                setPreference(nextTheme);
              }}
            >
              <Eclipse aria-hidden="true" />
              <span>{english ? "Theme" : "Tema"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="user-menu-popover__preference"
              aria-label={languageActionLabel}
              title={languageActionLabel}
              onSelect={(event) => {
                event.preventDefault();
                setLanguage(english ? "es" : "en");
              }}
            >
              <Languages aria-hidden="true" />
              <span>{english ? "Language" : "Idioma"}</span>
            </DropdownMenuItem>
          </div>
          {(themeStorageError || languageStorageError) && (
            <span className="user-menu-popover__storage-error" role="status">
              {english
                ? "The preference is active for this visit but could not be saved in this browser."
                : "La preferencia se aplica durante esta visita, pero no se pudo guardar en este navegador."}
            </span>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              variant="destructive"
              onSelect={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Link
                to={LOGOUT_PATH}
                state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}
                className="user-menu-popover__item"
              >
                <MorphingIcon
                  icon={LogOut}
                  className="user-menu-popover__icon"
                  aria-hidden="true"
                />
                <span>{english ? "Sign out" : "Cerrar sesión"}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
