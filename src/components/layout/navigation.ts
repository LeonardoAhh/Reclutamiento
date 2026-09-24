import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChartSpline,
  Contact,
  ContactRound,
  Files,
  House,
  ListTodo,
  NotebookText,
  Route,
  UserRoundPen,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EMPLEADOS_PATH, PLANTILLA_PATH } from "@/lib/plantillaNavigation";
import { ADMINISTRATION_PATH, getConfiguracionHref } from "@/lib/configuracionNavigation";

export type NavigationRole = "admin" | "reclutador";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
  mobilePriority?: boolean;
  roles?: ReadonlyArray<NavigationRole>;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const ACTIVIDADES_PATH = "/actividades";
export const ACCOUNT_PATH = "/cuenta";
export const HOME_PATH = "/inicio";

export const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  {
    title: "Principal",
    items: [
      {
        to: HOME_PATH,
        label: "Inicio",
        icon: House,
        end: true,
      },
      { to: getConfiguracionHref("analisis"), label: "Análisis", icon: ChartSpline },
      {
        to: "/candidatos",
        label: "Candidatos",
        icon: UserSearch,
        mobilePriority: true,
      },
      { to: EMPLEADOS_PATH, label: "Empleados", icon: ContactRound },
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
      {
        to: "/actualizacion-datos",
        label: "Campaña",
        icon: UserRoundPen,
        roles: ["admin", "reclutador"],
      },
      { to: "/reportes", label: "Reporte Diario", icon: NotebookText },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: ACTIVIDADES_PATH, label: "Actividades", icon: ListTodo },
      { to: getConfiguracionHref("formatos"), label: "Formatos", icon: Files },
      { to: ADMINISTRATION_PATH, label: "Indicadores", icon: ChartNoAxesCombined },
      { to: getConfiguracionHref("rutas"), label: "Rutas", icon: Route },
      { to: getConfiguracionHref("tabulador"), label: "Tabulador", icon: BadgeDollarSign },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_GROUPS.flatMap(group => group.items);
