import {
  LayoutGrid,
  Contact,
  Calendar,
  Building2,
  Briefcase,
  SlidersHorizontal,
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
  { to: '/resumen', label: 'Resumen', icon: LayoutGrid, end: false, mobilePriority: true },
  { to: '/candidatos', label: 'Candidatos', icon: Contact, mobilePriority: true },
  { to: '/reportes', label: 'Reportes', icon: Calendar },
  { to: '/plantilla', label: 'Plantilla', icon: Building2 },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/configuracion', label: 'Configuración', icon: SlidersHorizontal },
];
