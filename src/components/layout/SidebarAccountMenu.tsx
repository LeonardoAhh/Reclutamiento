import { Fragment, useId, useRef, useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { CalendarDays, CalendarPlus, ChevronsUp, CircleUserRound, LogOut, UserRound } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSignOut } from '@/features/account/useSignOut';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { useIsMobile } from '@/hooks/useIsMobile';
import { preloadRoute } from '@/lib/routePages';
import { playSound } from '@/lib/sound';
import { toNaturalCase } from '@/lib/utils';
import { ACCOUNT_PATH } from './navigation';
import type { SidebarQuickActionsControls } from './SidebarQuickActions';
import { SidebarThemeFooter } from './SidebarThemeFooter';
import './SidebarAccountMenu.css';

type SidebarAccountMenuProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  collapsed: boolean;
  mobile: boolean;
  quickActions?: SidebarQuickActionsControls;
};

export function SidebarAccountMenu({
  username,
  displayName,
  avatarUrl,
  role,
  collapsed,
  mobile,
  quickActions,
}: SidebarAccountMenuProps) {
  const { language } = useLanguage();
  const isMobileViewport = useIsMobile();
  const accountActive = Boolean(useMatch(ACCOUNT_PATH));
  const leaveRequestsActive = Boolean(useMatch(LEAVE_REQUESTS_PATH));
  const groupId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingLeavePolicyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { handleSignOut, isLoading } = useSignOut();
  const awaitingConfirmation = confirming && !isLoading;
  const name = toNaturalCase(displayName || username, { preserveAcronyms: false });
  const roleLabel =
    role === 'admin'
      ? language === 'en'
        ? 'Administrator'
        : 'Administrador'
      : role === 'reclutador'
        ? language === 'en'
          ? 'Recruiter'
          : 'Reclutador'
        : '';
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        ref={triggerRef}
        type="button"
        className="sidebar__account-trigger"
        aria-label={language === 'en' ? `Account menu for ${name}` : `Menú de cuenta de ${name}`}
        aria-expanded={open}
        onClick={() => playSound(open ? 'close' : 'open')}
      >
        <Avatar name={name} src={avatarUrl} fallback={<UserRound aria-hidden="true" />} />
        <span className="sidebar__account-copy">
          <span className="sidebar__account-name">{name}</span>
          {roleLabel && <span className="sidebar__account-role">{roleLabel}</span>}
        </span>
        <ChevronsUp className="sidebar__account-chevron" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
  );
  const menuGroups = [
    {
      label: language === 'en' ? 'Account' : 'Cuenta',
      content: (
        <DropdownMenuGroup aria-labelledby={`${groupId}-account`}>
          <DropdownMenuLabel id={`${groupId}-account`}>{language === 'en' ? 'Account' : 'Cuenta'}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link
              to={ACCOUNT_PATH}
              aria-current={accountActive ? 'page' : undefined}
              onClick={() => playSound('navigate')}
            >
              <CircleUserRound aria-hidden="true" />
              {language === 'en' ? 'My profile' : 'Mi perfil'}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      ),
    },
    ...(quickActions
      ? [
          {
            label: language === 'en' ? 'Requests' : 'Solicitudes',
            content: (
              <DropdownMenuGroup aria-labelledby={`${groupId}-requests`}>
                <DropdownMenuLabel id={`${groupId}-requests`}>
                  {language === 'en' ? 'Requests' : 'Solicitudes'}
                </DropdownMenuLabel>
                {quickActions.canReviewRequests ? (
                  <DropdownMenuItem asChild>
                    <Link
                      to={LEAVE_REQUESTS_PATH}
                      aria-current={leaveRequestsActive ? 'page' : undefined}
                      onClick={() => playSound('navigate')}
                      onPointerEnter={() => preloadRoute(LEAVE_REQUESTS_PATH)}
                      onFocus={() => preloadRoute(LEAVE_REQUESTS_PATH)}
                    >
                      <CalendarDays aria-hidden="true" />
                      {language === 'en' ? 'Requests' : 'Gestionar'}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      const focusTarget = triggerRef.current;
                      if (!focusTarget) return;
                      openingLeavePolicyRef.current = true;
                      setOpen(false);
                      playSound('open');
                      quickActions.openLeavePolicy(focusTarget);
                    }}
                  >
                    <CalendarPlus aria-hidden="true" />
                    {language === 'en' ? 'Leave' : 'Solicitar'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            ),
          },
        ]
      : []),
    {
      label: language === 'en' ? 'Session' : 'Sesión',
      content: (
        <DropdownMenuGroup aria-labelledby={`${groupId}-session`}>
          <DropdownMenuLabel id={`${groupId}-session`}>{language === 'en' ? 'Session' : 'Sesión'}</DropdownMenuLabel>
          <div className="sidebar__account-actions" data-confirming={awaitingConfirmation}>
            {awaitingConfirmation && (
              <DropdownMenuItem
                data-cuelume-tap=""
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirming(false);
                }}
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label={
                isLoading
                  ? language === 'en'
                    ? 'Signing out'
                    : 'Cerrando sesión'
                  : confirming
                    ? language === 'en'
                      ? 'Confirm sign out'
                      : 'Confirmar cierre de sesión'
                    : undefined
              }
              onSelect={(event) => {
                if (!confirming) {
                  event.preventDefault();
                  playSound('attention');
                  setConfirming(true);
                } else {
                  setOpen(false);
                  setConfirming(false);
                  void handleSignOut();
                }
              }}
            >
              <LogOut aria-hidden="true" />
              {isLoading
                ? language === 'en'
                  ? 'Signing out…'
                  : 'Cerrando sesión…'
                : confirming
                  ? language === 'en'
                    ? 'Confirm'
                    : 'Confirmar'
                  : language === 'en'
                    ? 'Sign out'
                    : 'Cerrar sesión'}
            </DropdownMenuItem>
          </div>
        </DropdownMenuGroup>
      ),
    },
  ].sort((first, second) =>
    first.label.localeCompare(second.label, language === 'en' ? 'en' : 'es', { sensitivity: 'base' }),
  );

  return (
    <DropdownMenu
      modal={mobile}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setConfirming(false);
      }}
    >
      {collapsed ? (
        <Tooltip content={language === 'en' ? 'Account' : 'Cuenta'} side="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent
        side="top"
        align="start"
        className="sidebar__account-menu"
        onCloseAutoFocus={(event) => {
          if (openingLeavePolicyRef.current) {
            event.preventDefault();
            openingLeavePolicyRef.current = false;
          }
        }}
      >
        {collapsed && (
          <>
            <DropdownMenuLabel className="sidebar__account-menu-header">
              <span className="sidebar__account-menu-name">{name}</span>
              <span className="sidebar__account-menu-meta">
                {roleLabel ? `${roleLabel} · ViñoPlastic` : 'ViñoPlastic'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {menuGroups.map(({ label, content }, index) => (
          <Fragment key={label}>
            {index > 0 && <DropdownMenuSeparator />}
            {content}
          </Fragment>
        ))}
        {!isMobileViewport && (
          <>
            <DropdownMenuSeparator />
            <SidebarThemeFooter language={language} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
