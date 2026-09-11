import { useLocation } from 'react-router-dom';
import { Files, ListTodo, MessagesSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { ACTIVIDADES_PATH } from './navigation';

interface ActivityLink {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const ACTIVITY_LINKS: ReadonlyArray<ActivityLink> = [
  {
    id: 'actividades',
    label: 'Actividades',
    icon: ListTodo,
    href: ACTIVIDADES_PATH,
  },
  {
    id: 'formatos',
    label: 'Formatos',
    icon: Files,
    href: getConfiguracionHref('formatos'),
  },
  {
    id: 'speech',
    label: 'Speech WA',
    icon: MessagesSquare,
    href: getConfiguracionHref('speech'),
  },
];

export function ActividadesNavItem(
  props: Pick<SidebarSectionNavProps, 'item' | 'collapsed' | 'mobile' | 'onNavigate'>,
) {
  const location = useLocation();
  const isActive = ACTIVITY_LINKS.some(({ href }) => href === location.pathname);

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={[
        {
          id: 'actividades',
          items: ACTIVITY_LINKS.map((item) => ({
            ...item,
            isCurrent: item.href === location.pathname,
          })),
        },
      ]}
    />
  );
}
