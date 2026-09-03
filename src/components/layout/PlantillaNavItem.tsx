import { useLocation } from 'react-router-dom';
import { ChartSpline, ContactRound, Network } from 'lucide-react';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { getPlantillaHref, getPlantillaView, isPlantillaPath } from '@/lib/plantillaNavigation';
import type { PlantillaView } from '@/lib/plantillaNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

const LINKS = [
  {
    id: 'analisis',
    label: 'Análisis',
    icon: ChartSpline,
    href: getConfiguracionHref('analisis'),
  },
  {
    id: 'general',
    label: 'Departamentos',
    icon: Network,
    href: getPlantillaHref('general'),
  },
  {
    id: 'empleados',
    label: 'Empleados',
    icon: ContactRound,
    href: getPlantillaHref('empleados'),
  },
] satisfies Array<{
  id: PlantillaView | 'analisis';
  label: string;
  icon: typeof Network;
  href: string;
}>;

export function PlantillaNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const view = getPlantillaView(location.pathname);
  const isActive = isPlantillaPath(location.pathname) ||
    location.pathname === getConfiguracionHref('analisis');

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={[{
        id: 'plantilla',
        items: LINKS.map(({ id, label, icon, href }) => ({
          id, label, icon, href,
          isCurrent: id === 'analisis'
            ? location.pathname === href
            : isPlantillaPath(location.pathname) && view === id,
        })),
      }]}
    />
  );
}
