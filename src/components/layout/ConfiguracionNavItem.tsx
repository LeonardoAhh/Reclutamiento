import { useLocation } from 'react-router-dom';
import {
  CONFIGURACION_OPERATION_LINKS,
  CONFIGURACION_PATH,
  FEATURE_GROUPS,
  INCIDENCIAS_PATH,
  getConfiguracionHref,
  getConfiguracionTab,
} from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const tab = getConfiguracionTab(location.pathname);
  const isConfiguracionPath = location.pathname === CONFIGURACION_PATH ||
    location.pathname.startsWith(`${CONFIGURACION_PATH}/`);
  const isIncidenciasPath = location.pathname === INCIDENCIAS_PATH;
  const isActive = isConfiguracionPath || isIncidenciasPath;

  return (
    <SidebarSectionNav
      {...props}
      href={getConfiguracionHref('busqueda')}
      isActive={isActive}
      isCurrent={isConfiguracionPath && tab === 'busqueda'}
      groups={[
        ...FEATURE_GROUPS.map((group) => ({
          id: group.title ?? 'principal',
          title: group.title,
          items: group.items.map(({ id, label, icon }) => ({
            id, label, icon,
            href: getConfiguracionHref(id),
            isCurrent: isConfiguracionPath && tab === id,
          })),
        })),
        {
          id: 'operacion',
          title: 'Operación',
          items: CONFIGURACION_OPERATION_LINKS.map((item) => ({
            ...item,
            isCurrent: item.href === location.pathname,
          })),
        },
      ]}
    />
  );
}
