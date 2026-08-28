import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { MaintenanceModeModal } from "@/features/system/MaintenanceModeModal";
import { UserActivityModal } from "@/features/system/UserActivityModal";
import { ChevronsUpDown, DoorOpen, LoaderCircle } from "lucide";
import { Activity, CalendarClock, ShieldAlert, UserRoundPen } from "lucide-react";
import "./UserMenuPopover.css";

type UserMenuModal = "avatar" | "maintenance" | "activity" | null;

interface UserMenuPopoverProps {
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  collapsed: boolean;
  mobile: boolean;
  isAdmin: boolean;
  version: string | null;
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
  version,
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        <PopoverContent
          align={mobile ? "start" : "end"}
          side={mobile ? "top" : "right"}
          className="user-menu-popover"
          role="dialog"
          aria-label="Opciones de usuario"
          onCloseAutoFocus={(event) => {
            if (!openingModalRef.current) return;
            event.preventDefault();
            openingModalRef.current = false;
          }}
        >
          <header className="user-menu-popover__header">
            <span className="user-menu-popover__name">
              {username}
            </span>
            {version && (
              <span className="user-menu-popover__version">v{version}</span>
            )}
            {email && (
              <span className="user-menu-popover__email">{email}</span>
            )}
          </header>

          <div className="user-menu-popover__divider" role="separator" />

          <div className="user-menu-popover__actions">
            <button
              type="button"
              className="user-menu-popover__item"
              onClick={() => handleOpenModal("avatar")}
            >
              <UserRoundPen className="user-menu-popover__icon" aria-hidden="true" />
              <span>Avatar</span>
            </button>

            <ThemeToggle className="user-menu-popover__item" />

            <a
              href="/horarios/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="user-menu-popover__item"
              onClick={() => setOpen(false)}
              aria-label="Horarios (abre en una pestaña nueva)"
            >
              <CalendarClock className="user-menu-popover__icon" aria-hidden="true" />
              <span>Horarios</span>
            </a>

            {isAdmin && (
              <>
                <div className="user-menu-popover__divider" role="separator" />

                <button
                  type="button"
                  className="user-menu-popover__item"
                  onClick={() => handleOpenModal("maintenance")}
                  aria-label="Abrir modo mantenimiento"
                >
                  <ShieldAlert
                    className="user-menu-popover__icon"
                    aria-hidden="true"
                  />
                  <span>Mantenimiento</span>
                </button>

                <button
                  type="button"
                  className="user-menu-popover__item"
                  onClick={() => handleOpenModal("activity")}
                  aria-label="Abrir actividad de usuarios"
                >
                  <Activity
                    className="user-menu-popover__icon"
                    aria-hidden="true"
                  />
                  <span>Actividad</span>
                </button>
              </>
            )}

            <div className="user-menu-popover__divider" role="separator" />

            <button
              type="button"
              className="user-menu-popover__item user-menu-popover__item--danger"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              disabled={signingOut}
              aria-busy={signingOut}
            >
              <MorphingIcon
                icon={signingOut ? LoaderCircle : DoorOpen}
                className={`user-menu-popover__icon${signingOut ? " spin" : ""}`}
                aria-hidden="true"
              />
              <span>{signingOut ? "Cerrando..." : "Cerrar sesión"}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <AvatarUploadModal
        isOpen={activeModal === "avatar"}
        onClose={handleCloseModal}
      />
      {activeModal === "maintenance" && (
        <MaintenanceModeModal isOpen onClose={handleCloseModal} />
      )}
      {activeModal === "activity" && (
        <UserActivityModal isOpen onClose={handleCloseModal} />
      )}
    </>
  );
}
