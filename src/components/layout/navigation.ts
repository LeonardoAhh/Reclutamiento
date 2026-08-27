import {
  BotMessageSquare,
  ChartNoAxesCombined,
  ClipboardPenLine,
  Contact,
  ListTodo,
  NotebookText,
  Settings2,
  UserSearch,
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
        icon: UserSearch,
        mobilePriority: true,
      },
      { to: "/plantilla", label: "Plantilla", icon: Contact },
      {
        to: "/resumen",
        label: "Resumen",
        icon: ChartNoAxesCombined,
        end: false,
        mobilePriority: true,
      },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { to: "/asistente", label: "Asistente", icon: BotMessageSquare, mobilePriority: true },
      { to: "/reportes", label: "Reporte Diario", icon: NotebookText },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: "/actividades", label: "Actividades", icon: ListTodo },
      { to: "/configuracion", label: "Configuración", icon: Settings2 },
      { to: "/perfil-general", label: "Perfil General", icon: ClipboardPenLine },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_GROUPS.flatMap(group => group.items);
