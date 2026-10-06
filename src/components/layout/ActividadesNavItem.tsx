import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { ACTIVIDADES_NAV_GROUPS } from './navigationCatalog';

export function ActividadesNavItem(
  props: Pick<SidebarSectionNavProps, 'item' | 'mobile' | 'onNavigate'>,
) {
  const location = useLocation();
  const { language } = useLanguage();
  const isActive = ACTIVIDADES_NAV_GROUPS.some((group) =>
    group.items.some(({ href }) => href === location.pathname),
  );

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={ACTIVIDADES_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          label: language === 'en' && item.label === 'Formatos' ? 'Forms' : item.label,
          isCurrent: item.href === location.pathname,
        })),
      }))}
    />
  );
}
