import { useLocation } from 'react-router-dom';
import { CalendarClock, Files, ListTodo, MessagesSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DAILY_WORK_LOG_PATH } from '@/features/daily-work-log/constants';
import { useAuth, type Profile } from '@/hooks/useAuth';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { SidebarSectionNav, type SidebarSectionNavProps } from './SidebarSectionNav';
import { ACTIVIDADES_PATH } from './navigation';

interface ActivityLink {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  roles?: ReadonlyArray<Profile['role']>;
}

const ACTIVITY_LINKS: ReadonlyArray<ActivityLink> = [
  {
    id: 'actividades',
    label: 'Actividades',
    icon: ListTodo,
    href: ACTIVIDADES_PATH,
  },
  {
    id: 'daily-work-log',
    label: 'Bitácora diaria',
    icon: CalendarClock,
    href: DAILY_WORK_LOG_PATH,
    roles: ['admin', 'reclutador'],
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
  const { profile } = useAuth();
  const visibleLinks = ACTIVITY_LINKS.filter(
    (item) => !item.roles || (profile && item.roles.includes(profile.role)),
  );
  const isActive = visibleLinks.some(({ href }) => href === location.pathname);

  return (
    <SidebarSectionNav
      {...props}
      isActive={isActive}
      groups={[
        {
          id: 'actividades',
          items: visibleLinks.map((item) => ({
            ...item,
            isCurrent: item.href === location.pathname,
          })),
        },
      ]}
    />
  );
}
