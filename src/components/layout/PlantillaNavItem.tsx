import { useLocation } from 'react-router-dom';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { getPlantillaView, isPlantillaPath } from '@/lib/plantillaNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { PLANTILLA_NAV_GROUPS } from './navigationCatalog';

export function PlantillaNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const view = getPlantillaView(location.pathname);
  const isActive = isPlantillaPath(location.pathname) ||
    location.pathname === getConfiguracionHref('analisis');

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={PLANTILLA_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map(({ id, label, icon, href, external }) => ({
          id, label, icon, href, external,
          isCurrent: id === 'analisis'
            ? location.pathname === href
            : isPlantillaPath(location.pathname) && view === id,
        })),
      }))}
    />
  );
}
