import { useLocation } from 'react-router-dom';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { CONFIGURACION_NAV_GROUPS } from './navigationCatalog';
import { ROUTE_DAY_EMPLOYEES_PATH, getConfiguracionHref } from '@/lib/configuracionNavigation';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const isRouteDay = location.pathname === ROUTE_DAY_EMPLOYEES_PATH;
  const isActive = CONFIGURACION_NAV_GROUPS.some((group) =>
    group.items.some(({ href }) => href === location.pathname || (isRouteDay && href === getConfiguracionHref('rutas'))),
  );

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={CONFIGURACION_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          isCurrent: item.href === location.pathname || (isRouteDay && item.href === getConfiguracionHref('rutas')),
        })),
      }))}
    />
  );
}
