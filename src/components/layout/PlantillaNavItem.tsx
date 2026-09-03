import { useLocation } from 'react-router-dom';
import { ContactRound, Network } from 'lucide-react';
import { getPlantillaHref, getPlantillaView } from '@/lib/plantillaNavigation';
import type { PlantillaView } from '@/lib/plantillaNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

const VIEWS = [
  { view: 'general', label: 'Departamentos', icon: Network },
  { view: 'empleados', label: 'Empleados', icon: ContactRound },
] satisfies Array<{ view: PlantillaView; label: string; icon: typeof Network }>;

export function PlantillaNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const view = getPlantillaView(location.search);
  const search = location.pathname === props.item.to ? location.search : '';

  return (
    <SidebarSectionNav
      {...props}
      href={getPlantillaHref('general', search)}
      isCurrent={view === 'general'}
      groups={[{
        id: 'plantilla',
        items: VIEWS.map(({ view: targetView, label, icon }) => ({
          id: targetView, label, icon,
          href: getPlantillaHref(targetView, search),
          isCurrent: view === targetView,
        })),
      }]}
    />
  );
}
