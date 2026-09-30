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
import { ChevronsUpDown, LogOut } from "lucide";
import { UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

  return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="sidebar__user-trigger"
            aria-label={`Abrir opciones de ${displayName}${email ? `, ${email}` : ""}`}
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
          aria-label="Opciones de usuario"
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
                <span>Cuenta</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

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
                <span>Cerrar sesión</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
