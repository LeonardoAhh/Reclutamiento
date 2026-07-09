import * as React from 'react';
import { PanelLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '15rem';
const SIDEBAR_WIDTH_ICON = '3.5rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export const SidebarProvider = React.forwardRef(
  (
    { defaultOpen = true, open: openProp, onOpenChange, className, style, children, ...props },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (onOpenChange) onOpenChange(openState);
        else _setOpen(openState);
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [onOpenChange, open]
    );

    const toggleSidebar = React.useCallback(() => setOpen((o) => !o), [setOpen]);

    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo(
      () => ({ state, open, setOpen, isMobile, toggleSidebar }),
      [state, open, setOpen, isMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            ref={ref}
            style={{
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            }}
            className={cn('group/sidebar-wrapper flex min-h-screen w-full', className)}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

export const Sidebar = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { state, isMobile } = useSidebar();

    // On mobile the route picker is rendered as top tabs instead of a sidebar.
    if (isMobile) return null;

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === 'collapsed' ? 'icon' : ''}
        {...props}
      >
        {/* gap spacer that animates the layout width */}
        <div
          className={cn(
            'relative h-svh w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]'
          )}
        />
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear md:flex',
            'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]',
            className
          )}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = React.forwardRef(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9', className)}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        aria-label="Mostrar u ocultar el menú de rutas"
        data-testid="sidebar-trigger"
        {...props}
      >
        <PanelLeftIcon />
        <span className="sr-only">Alternar menú</span>
      </Button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Alternar menú"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        'absolute inset-y-0 right-0 z-20 hidden w-2 -translate-x-1/2 transition-colors hover:bg-sidebar-border md:flex',
        className
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = 'SidebarRail';

export const SidebarInset = React.forwardRef(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn('relative flex min-h-svh flex-1 flex-col bg-canvas', className)}
    {...props}
  />
));
SidebarInset.displayName = 'SidebarInset';

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn('flex flex-col gap-2 p-2', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn('mt-auto flex flex-col gap-2 p-2', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn(
      'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group"
    className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
    {...props}
  />
));
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-sm px-2 text-caption-md uppercase tracking-wide text-mute outline-none transition-[margin,opacity] duration-200 ease-linear',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      {...props}
    />
  )
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef(
  ({ isActive = false, tooltip, className, children, ...props }, ref) => {
    const { state } = useSidebar();

    const button = (
      <button
        ref={ref}
        type="button"
        data-active={isActive}
        className={cn(
          'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-body-strong outline-none transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-primary',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
          '[&>svg]:size-5 [&>svg]:shrink-0',
          isActive
            ? 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'
            : 'text-sidebar-foreground',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );

    if (!tooltip || state !== 'collapsed') return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarMenuSkeleton({ className, showIcon = true, ...props }) {
  const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  return (
    <div
      className={cn('flex h-9 items-center gap-3 rounded-sm p-2', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-5 rounded-sm" />}
      <Skeleton className="h-4 max-w-[var(--skeleton-width)] flex-1" style={{ '--skeleton-width': width }} />
    </div>
  );
}
