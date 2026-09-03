import { useLocation } from 'react-router-dom';
import {
  CONFIGURACION_OPERATION_LINKS,
  CONFIGURACION_PATH,
  FEATURE_GROUPS,
  INCIDENCIAS_PATH,
  type FeatureId,
  getConfiguracionHref,
  getConfiguracionTab,
} from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

const CONFIGURACION_NAV_FEATURES: ReadonlySet<FeatureId> = new Set([
  'indicadores',
  'tabulador',
]);

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const tab = getConfiguracionTab(location.pathname);
  const isConfiguracionPath = location.pathname === CONFIGURACION_PATH ||
    location.pathname.startsWith(`${CONFIGURACION_PATH}/`);
  const isIncidenciasPath = location.pathname === INCIDENCIAS_PATH;
  const isActive = isIncidenciasPath ||
    (isConfiguracionPath && (CONFIGURACION_NAV_FEATURES.has(tab) || tab === 'rutas'));

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={[
        ...FEATURE_GROUPS.map((group) => ({
          id: group.title ?? 'principal',
          title: group.title,
          items: group.items
            .filter(({ id }) => CONFIGURACION_NAV_FEATURES.has(id))
            .map(({ id, label, icon }) => ({
              id, label, icon,
              href: getConfiguracionHref(id),
              isCurrent: isConfiguracionPath && tab === id,
            })),
        })).filter(({ items }) => items.length > 0),
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
