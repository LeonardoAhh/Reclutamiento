import { useLocation } from 'react-router-dom';
import {
  CONFIGURACION_PATH,
  INCIDENCIAS_PATH,
  getConfiguracionTab,
} from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { CONFIGURACION_NAV_GROUPS } from './navigationCatalog';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const tab = getConfiguracionTab(location.pathname);
  const isConfiguracionPath = location.pathname === CONFIGURACION_PATH ||
    location.pathname.startsWith(`${CONFIGURACION_PATH}/`);
  const isIncidenciasPath = location.pathname === INCIDENCIAS_PATH;
  const isActive = isIncidenciasPath ||
    (isConfiguracionPath && CONFIGURACION_NAV_GROUPS.some((group) =>
      group.items.some(({ href }) => href === location.pathname),
    ));

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={CONFIGURACION_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          isCurrent: item.id === 'indicadores' || item.id === 'tabulador'
            ? isConfiguracionPath && tab === item.id
            : item.href === location.pathname,
        })),
      }))}
    />
  );
}
