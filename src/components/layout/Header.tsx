import { useState, type Ref } from 'react';
import { Bell, BellRing } from 'lucide';
import { X } from 'lucide-react';
import { MorphMenuIcon } from '@/components/ui/MorphMenuIcon';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Language } from '@/contexts/LanguageContext';
import { LeaveApprovalNotifications } from '@/features/leave/LeaveApprovalNotifications';
import { useLeaveNotificationCount } from '@/features/leave/useLeaveNotificationCount';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';
import './Header.css';

interface HeaderProps {
  pageTitle: string;
  isHome: boolean;
  isDesktop: boolean;
  onMobileMenuToggle: () => void;
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  mobileMenuOpen?: boolean;
  language: Language;
}

export function Header({
  pageTitle,
  isHome,
  isDesktop,
  onMobileMenuToggle,
  mobileMenuOpen = false,
  mobileMenuButtonRef,
  language,
}: HeaderProps) {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { count: notificationCount, markDecisionsViewed } = useLeaveNotificationCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) setNotificationRefreshKey((key) => key + 1);
  };
  const toggleLabel = mobileMenuOpen
    ? language === 'en'
      ? 'Hide menu'
      : 'Ocultar menú'
    : language === 'en'
      ? 'Sidebar'
      : 'Barra lateral';
  const sidebarToggle = (
    <button
      ref={mobileMenuButtonRef}
      type="button"
      className="app-header__sidebar-toggle"
      onClick={onMobileMenuToggle}
      data-cuelume-open={mobileMenuOpen ? undefined : ''}
      data-cuelume-close={mobileMenuOpen ? '' : undefined}
      aria-expanded={mobileMenuOpen}
      aria-controls="app-sidebar"
      aria-label={toggleLabel}
    >
      <MorphMenuIcon isOpen={mobileMenuOpen} size="var(--icon-size-md)" />
    </button>
  );

  const notificationLabel = language === 'en' ? 'Notifications' : 'Notificaciones';
  const notificationButtonLabel = notificationCount
    ? `${notificationLabel}, ${notificationCount} ${
        profile?.role === 'admin'
          ? language === 'en'
            ? 'pending requests'
            : 'solicitudes pendientes'
          : language === 'en'
            ? 'new decisions'
            : 'decisiones nuevas'
      }`
    : notificationLabel;
  const notificationTrigger = (
    <button type="button" className="app-header__notification-trigger" aria-label={notificationButtonLabel}>
      <MorphingIcon icon={notificationsOpen ? BellRing : Bell} size="var(--icon-size-md)" aria-hidden="true" />
      {notificationCount !== null && notificationCount > 0 && (
        <span className="app-header__notification-count" aria-hidden="true">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );
  const notificationBody = (
    <LeaveApprovalNotifications
      open={notificationsOpen}
      language={language}
      refreshKey={notificationRefreshKey}
      onDecisionsViewed={markDecisionsViewed}
    />
  );

  return (
    <Sheet open={notificationsOpen && !isMobile} onOpenChange={handleNotificationsOpenChange}>
      <Popover open={isMobile && notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
        <header className="app-header" id="main-header">
          <div className="app-header__inner">
            <div className="app-header__left">
              <div className="app-header__title" id="app-header-title">
                {isHome ? (
                  <span className="app-header__fallback-title">{pageTitle}</span>
                ) : (
                  <h1 className="app-header__fallback-title">{pageTitle}</h1>
                )}
              </div>
              <div className="app-header__actions">
                {isMobile ? (
                  <PopoverTrigger asChild>{notificationTrigger}</PopoverTrigger>
                ) : (
                  <SheetTrigger asChild>{notificationTrigger}</SheetTrigger>
                )}
                {!isDesktop &&
                  (isMobile ? (
                    sidebarToggle
                  ) : (
                    <Tooltip content={toggleLabel} side="bottom">
                      {sidebarToggle}
                    </Tooltip>
                  ))}
              </div>
            </div>
          </div>
        </header>
        {isMobile && (
          <PopoverContent
            side="bottom"
            align="end"
            className="leave-approval-notifications__mobile-popover"
            aria-label={notificationLabel}
          >
            <div className="leave-approval-notifications__mobile-header">
              <h2 className="leave-approval-notifications__mobile-title">{notificationLabel}</h2>
              <button
                type="button"
                className="leave-approval-notifications__mobile-close"
                aria-label={language === 'en' ? 'Close notifications' : 'Cerrar notificaciones'}
                onClick={() => handleNotificationsOpenChange(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="sheet-body leave-approval-notifications__sheet-body">{notificationBody}</div>
          </PopoverContent>
        )}
      </Popover>
      {!isMobile && (
        <SheetContent variant="floating" aria-labelledby="header-notifications-title">
          <SheetHeader>
            <SheetTitle id="header-notifications-title">{notificationLabel}</SheetTitle>
          </SheetHeader>
          <SheetBody className="leave-approval-notifications__sheet-body">{notificationBody}</SheetBody>
        </SheetContent>
      )}
    </Sheet>
  );
}
