import { Fragment, useRef } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { BookOpenCheck, CalendarDays, CalendarPlus, CircleUserRound, UserRound } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSignOut } from '@/features/account/useSignOut';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { accountCopy } from '@/pages/account-translations';
import { useIsMobile } from '@/hooks/useIsMobile';
import { preloadRoute } from '@/lib/routePages';
import { playSound } from '@/lib/sound';
import { toNaturalCase } from '@/lib/utils';
import { ACCOUNT_PATH } from './navigation';
import type { SidebarQuickActionsControls } from './SidebarQuickActions';
import { SidebarAccountMenuFooter } from './SidebarAccountMenuFooter';
import './SidebarAccountMenu.css';

type SidebarAccountMenuProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  collapsed: boolean;
  mobile: boolean;
  quickActions?: SidebarQuickActionsControls;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayTour: () => void;
  tourActive: boolean;
};

export function SidebarAccountMenu({
  username,
  displayName,
  avatarUrl,
  role,
  collapsed,
  mobile,
  quickActions,
  open,
  onOpenChange,
  onReplayTour,
  tourActive,
}: SidebarAccountMenuProps) {
  const { language } = useLanguage();
  const isMobileViewport = useIsMobile();
  const accountActive = Boolean(useMatch(ACCOUNT_PATH));
  const leaveRequestsActive = Boolean(useMatch(LEAVE_REQUESTS_PATH));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingLeavePolicyRef = useRef(false);
  const { handleSignOut, isLoading } = useSignOut();
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
        data-tour="account-trigger"
        aria-label={language === 'en' ? `Account menu for ${name}` : `Menú de cuenta de ${name}`}
        aria-expanded={open}
        onClick={() => playSound(open ? 'close' : 'open')}
      >
        <Avatar name={name} src={avatarUrl} fallback={<UserRound aria-hidden="true" />} />
        <span className="sidebar__account-copy">
          <span className="sidebar__account-name">{name}</span>
          {roleLabel && <span className="sidebar__account-role">{roleLabel}</span>}
        </span>
      </button>
    </DropdownMenuTrigger>
  );
  const menuGroups = [
    {
      label: language === 'en' ? 'Account' : 'Cuenta',
      content: (
        <DropdownMenuGroup aria-label={language === 'en' ? 'Account' : 'Cuenta'}>
          <DropdownMenuItem asChild>
            <Link
              to={ACCOUNT_PATH}
              data-tour="account-profile-link"
              aria-current={accountActive ? 'page' : undefined}
              onClick={() => playSound('navigate')}
            >
              <CircleUserRound aria-hidden="true" />
              {language === 'en' ? 'My profile' : 'Mi perfil'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              onReplayTour();
            }}
          >
            <BookOpenCheck aria-hidden="true" />
            {accountCopy(language).replayTour}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      ),
    },
    ...(quickActions
      ? [
          {
            label: language === 'en' ? 'Requests' : 'Solicitudes',
            content: (
              <DropdownMenuGroup aria-label={language === 'en' ? 'Requests' : 'Solicitudes'}>
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
                      onOpenChange(false);
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
  ].sort((first, second) =>
    first.label.localeCompare(second.label, language === 'en' ? 'en' : 'es', { sensitivity: 'base' }),
  );

  return (
    <DropdownMenu modal={mobile && !tourActive} open={open} onOpenChange={onOpenChange}>
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
        {menuGroups.map(({ label, content }) => (
          <Fragment key={label}>{content}</Fragment>
        ))}
        <SidebarAccountMenuFooter
          language={language}
          isSigningOut={isLoading}
          showTheme={!isMobileViewport}
          onSignOut={() => {
            onOpenChange(false);
            void handleSignOut();
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
