import {
  BarChart3,
  Users,
  LayoutDashboard,
  CalendarRange,
  Briefcase,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  mobilePriority?: boolean;
};

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/', label: 'Reclutamiento', icon: BarChart3, end: true, mobilePriority: true },
  { to: '/pipeline', label: 'Candidatos', icon: Users, mobilePriority: true },
  { to: '/reporte-diario', label: 'Reporte Diario', icon: CalendarRange },
  { to: '/plantilla', label: 'Plantilla', icon: LayoutDashboard },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/features', label: 'Features', icon: Settings },
];
