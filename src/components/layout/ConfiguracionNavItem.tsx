import { useLocation } from 'react-router-dom';
import { FEATURE_GROUPS, getConfiguracionHref, getConfiguracionTab } from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';

export function ConfiguracionNavItem(props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>) {
  const location = useLocation();
  const tab = getConfiguracionTab(location.pathname);
  const isActive = location.pathname === props.item.to ||
    location.pathname.startsWith(`${props.item.to}/`);

  return (
    <SidebarSectionNav
      {...props}
      href={getConfiguracionHref('busqueda')}
      isActive={isActive}
      isCurrent={tab === 'busqueda'}
      groups={FEATURE_GROUPS.map((group) => ({
        id: group.title ?? 'principal',
        title: group.title,
        items: group.items.map(({ id, label, icon }) => ({
          id, label, icon,
          href: getConfiguracionHref(id),
          isCurrent: tab === id,
        })),
      }))}
    />
  );
}
