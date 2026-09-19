import { useLocation } from 'react-router-dom';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { CONFIGURACION_NAV_GROUPS } from './navigationCatalog';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const isActive = CONFIGURACION_NAV_GROUPS.some((group) =>
    group.items.some(({ href }) => href === location.pathname),
  );

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={CONFIGURACION_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          isCurrent: item.href === location.pathname,
        })),
      }))}
    />
  );
}
