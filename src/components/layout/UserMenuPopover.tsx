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
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { MaintenanceModeModal } from "@/features/system/MaintenanceModeModal";
import { UserActivityModal } from "@/features/system/UserActivityModal";
import { RecognitionPreferencesModal } from "@/components/ui/RecognitionPreferencesModal";
import { ChevronsUpDown, LoaderCircle, LogOut } from "lucide";
import {
  Activity,
  Medal,
  ShieldAlert,
  UserRoundPen,
} from "lucide-react";
import "./UserMenuPopover.css";

type UserMenuModal = "avatar" | "recognition" | "maintenance" | "activity" | null;

interface UserMenuPopoverProps {
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  collapsed: boolean;
  mobile: boolean;
  isAdmin: boolean;
  isRecruiter: boolean;
  signingOut: boolean;
  onSignOut: () => void;
}

export function UserMenuPopover({
  username,
  email,
  avatarUrl,
  collapsed,
  mobile,
  isAdmin,
  isRecruiter,
  signingOut,
  onSignOut,
}: UserMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<UserMenuModal>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingModalRef = useRef(false);

  const handleOpenModal = (modal: Exclude<UserMenuModal, null>) => {
    openingModalRef.current = true;
    setOpen(false);
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="sidebar__user-trigger"
            aria-label={`Abrir opciones de usuario de ${username}${email ? `, ${email}` : ''}`}
          >
            <Avatar name={username} src={avatarUrl} />
            {!collapsed && (
              <span className="sidebar__user-identity" aria-hidden="true">
                <span className="sidebar__user-name">{username}</span>
                {email && (
                  <span className="sidebar__user-email">{email}</span>
                )}
              </span>
            )}
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
          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              onSelect={() => handleOpenModal("avatar")}
            >
              <button type="button" className="user-menu-popover__item">
                <UserRoundPen
                  className="user-menu-popover__icon"
                  aria-hidden="true"
                />
                <span>Perfil</span>
              </button>
            </DropdownMenuItem>

            {isRecruiter && (
              <DropdownMenuItem
                asChild
                onSelect={() => handleOpenModal("recognition")}
              >
                <button type="button" className="user-menu-popover__item">
                  <Medal
                    className="user-menu-popover__icon"
                    aria-hidden="true"
                  />
                  <span>Reconocimientos</span>
                </button>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="user-menu-popover__section-label">
                Administración
              </DropdownMenuLabel>
              <DropdownMenuGroup className="user-menu-popover__group">
                <DropdownMenuItem
                  asChild
                  onSelect={() => handleOpenModal("maintenance")}
                >
                  <button
                    type="button"
                    className="user-menu-popover__item"
                    aria-label="Abrir modo mantenimiento"
                  >
                    <ShieldAlert
                      className="user-menu-popover__icon"
                      aria-hidden="true"
                    />
                    <span>Mantenimiento</span>
                  </button>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  onSelect={() => handleOpenModal("activity")}
                >
                  <button
                    type="button"
                    className="user-menu-popover__item"
                    aria-label="Abrir actividad de usuarios"
                  >
                    <Activity
                      className="user-menu-popover__icon"
                      aria-hidden="true"
                    />
                    <span>Actividad</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuGroup className="user-menu-popover__group">
            <DropdownMenuItem
              asChild
              variant="destructive"
              disabled={signingOut}
              onSelect={() => {
                setOpen(false);
                onSignOut();
              }}
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

      <AvatarUploadModal
        isOpen={activeModal === "avatar"}
        onClose={handleCloseModal}
      />
      {activeModal === "recognition" && (
        <RecognitionPreferencesModal isOpen onClose={handleCloseModal} />
      )}
      {activeModal === "maintenance" && (
        <MaintenanceModeModal isOpen onClose={handleCloseModal} />
      )}
      {activeModal === "activity" && (
        <UserActivityModal isOpen onClose={handleCloseModal} />
      )}
    </>
  );
}
