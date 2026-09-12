import {
  BotMessageSquare,
  ChartNoAxesCombined,
  Contact,
  ListTodo,
  NotebookText,
  Settings2,
  UserRoundPen,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PLANTILLA_PATH } from "@/lib/plantillaNavigation";
import { CONFIGURACION_PATH } from "@/lib/configuracionNavigation";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
  mobilePriority?: boolean;
  roles?: ReadonlyArray<"admin" | "reclutador">;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const ACTIVIDADES_PATH = "/actividades";

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
      { to: PLANTILLA_PATH, label: "Plantilla", icon: Contact },
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
      {
        to: "/actualizacion-datos",
        label: "Campaña",
        icon: UserRoundPen,
        roles: ["admin", "reclutador"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: ACTIVIDADES_PATH, label: "Actividades", icon: ListTodo },
      { to: CONFIGURACION_PATH, label: "Configuración", icon: Settings2 },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_GROUPS.flatMap(group => group.items);
