import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Avatar } from "@/components/ui/Avatar";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { ACCOUNT_PATH, LOGOUT_PATH } from "./navigation";
import { Eclipse, Languages, UserRound } from "lucide-react";
import { LogOut } from "lucide";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import "./UserMenuPopover.css";

interface UserMenuPopoverProps {
  displayName: string;
  avatarUrl?: string | null;
}

export function UserMenuPopover({
  displayName,
  avatarUrl,
}: UserMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
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
            className="user-menu-trigger"
            aria-label={english
              ? `Open options for ${displayName}`
              : `Abrir opciones de ${displayName}`}
          >
            <span className="user-menu-trigger__surface">
              <Avatar name={displayName} src={avatarUrl} />
              <span className="user-menu-trigger__name" aria-hidden="true">{displayName}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          className="user-menu-popover"
          aria-label={english ? "User options" : "Opciones de usuario"}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              onSelect={() => setOpen(false)}
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

          {!isDesktop && (
            <DropdownMenuGroup className="user-menu-popover__group">
              <DropdownMenuItem
                asChild
                variant="destructive"
                onSelect={() => setOpen(false)}
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
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
