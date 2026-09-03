import { useLocation } from 'react-router-dom';
import { ContactRound, Network } from 'lucide-react';
import { getPlantillaHref, getPlantillaView, isPlantillaPath } from '@/lib/plantillaNavigation';
import type { PlantillaView } from '@/lib/plantillaNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

const VIEWS = [
  { view: 'general', label: 'Departamentos', icon: Network },
  { view: 'empleados', label: 'Empleados', icon: ContactRound },
] satisfies Array<{ view: PlantillaView; label: string; icon: typeof Network }>;

export function PlantillaNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const view = getPlantillaView(location.pathname);
  const isActive = isPlantillaPath(location.pathname);

  return (
    <SidebarSectionNav
      {...props}
      href={getPlantillaHref('general')}
      isActive={isActive}
      isCurrent={view === 'general'}
      groups={[{
        id: 'plantilla',
        items: VIEWS.map(({ view: targetView, label, icon }) => ({
          id: targetView, label, icon,
          href: getPlantillaHref(targetView),
          isCurrent: view === targetView,
        })),
      }]}
    />
  );
}
