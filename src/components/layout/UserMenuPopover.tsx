import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Avatar } from "@/components/ui/Avatar";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { LogoutConfirmModal } from "@/features/account/LogoutConfirmModal";
import type { Profile } from "@/hooks/useAuth";
import { getUserTitle } from "@/lib/userIdentity";
import { ACCOUNT_PATH, AREA_PROGRESS_PATH } from "./navigation";
import { ChevronsUpDown, LoaderCircle, LogOut } from "lucide";
import { ClipboardList, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./UserMenuPopover.css";

interface UserMenuPopoverProps {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role?: Profile["role"];
  mobile: boolean;
  signingOut: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}

export function UserMenuPopover({
  displayName,
  email,
  avatarUrl,
  role,
  mobile,
  signingOut,
  onNavigate,
  onSignOut,
}: UserMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingModalRef = useRef(false);
  const roleLabel = getUserTitle(role, email);

  const handleOpenLogout = () => {
    openingModalRef.current = true;
    setOpen(false);
    setLogoutOpen(true);
  };

  const handleCloseLogout = () => {
    setLogoutOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleConfirmSignOut = () => {
    setLogoutOpen(false);
    requestAnimationFrame(onSignOut);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="sidebar__user-trigger"
            aria-label={`Abrir opciones de ${displayName}, ${roleLabel}`}
          >
            <Avatar name={displayName} src={avatarUrl} />
            <span className="sidebar__user-identity" aria-hidden="true">
              <span className="sidebar__user-role">{roleLabel}</span>
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
          aria-label="Opciones de usuario"
          onEscapeKeyDown={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            if (!openingModalRef.current) return;
            event.preventDefault();
            openingModalRef.current = false;
          }}
        >
          <DropdownMenuLabel className="user-menu-popover__identity">
            <span className="user-menu-popover__identity-copy">
              <span className="user-menu-popover__identity-name">{displayName}</span>
              {email && (
                <span className="user-menu-popover__identity-email">{email}</span>
              )}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

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
                <span>Cuenta</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              onSelect={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Link to={AREA_PROGRESS_PATH} className="user-menu-popover__item">
                <ClipboardList className="user-menu-popover__icon" aria-hidden="true" />
                <span>Pendientes</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              variant="destructive"
              disabled={signingOut}
              onSelect={handleOpenLogout}
            >
              <button
                type="button"
                className="user-menu-popover__item"
                disabled={signingOut}
                aria-busy={signingOut}
              >
                <MorphingIcon
                  icon={signingOut ? LoaderCircle : LogOut}
                  className={`user-menu-popover__icon${signingOut ? " spin" : ""}`}
                  aria-hidden="true"
                />
                <span>{signingOut ? "Cerrando..." : "Cerrar sesión"}</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmModal
        isOpen={logoutOpen}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        onConfirm={handleConfirmSignOut}
        onCancel={() => {
          if (!signingOut) handleCloseLogout();
        }}
        isLoading={signingOut}
      />
    </>
  );
}
