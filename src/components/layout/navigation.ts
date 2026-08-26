import {
  LayoutGrid,
  Contact,
  Calendar,
  Building2,
  Briefcase,
  SlidersHorizontal,
  ClipboardList,
  ClipboardCheck,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  mobilePriority?: boolean;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  {
    title: "Principal",
    items: [
      {
        to: "/candidatos",
        label: "Candidatos",
        icon: Contact,
        mobilePriority: true,
      },
      { to: "/plantilla", label: "Plantilla", icon: Building2 },
      {
        to: "/resumen",
        label: "Resumen",
        icon: LayoutGrid,
        end: false,
        mobilePriority: true,
      },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { to: "/asistente", label: "Asistente", icon: Bot, mobilePriority: true },
      { to: "/reportes", label: "Reporte Diario", icon: Calendar },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: "/actividades", label: "Actividades", icon: ClipboardList },
      { to: "/configuracion", label: "Configuración", icon: SlidersHorizontal },
      { to: "/perfil-general", label: "Perfil General", icon: ClipboardCheck },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_GROUPS.flatMap(group => group.items);
