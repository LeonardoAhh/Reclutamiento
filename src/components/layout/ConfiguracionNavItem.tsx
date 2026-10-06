import { useLocation } from 'react-router-dom';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { CONFIGURACION_NAV_GROUPS } from './navigationCatalog';
import { ROUTE_DAY_EMPLOYEES_PATH, getConfiguracionHref } from '@/lib/configuracionNavigation';
import { useLanguage } from '@/contexts/LanguageContext';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const { language } = useLanguage();
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
        title: language === 'en' && group.title === 'Administración' ? 'Administration' : group.title,
        items: group.items.map((item) => {
          const label = language === 'en'
            ? ({ Indicadores: 'Metrics', Tabulador: 'Salary scale', Rutas: 'Routes' }[item.label] ?? item.label)
            : item.label;
          return {
            ...item,
            label,
            isCurrent: item.href === location.pathname || (isRouteDay && item.href === getConfiguracionHref('rutas')),
          };
        }),
      }))}
    />
  );
}
