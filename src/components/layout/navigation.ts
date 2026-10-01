import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChartSpline,
  Contact,
  Files,
  House,
  ListTodo,
  NotebookText,
  Route,
  UserRoundPen,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PLANTILLA_PATH } from "@/lib/plantillaNavigation";
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

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const ACTIVIDADES_PATH = "/actividades";
export const ACCOUNT_PATH = "/cuenta";
export const TEAM_PATH = "/equipo";
export const LOGOUT_PATH = "/cerrar-sesion";
export const HOME_PATH = "/inicio";
export const APP_BRAND_NAME = "ViñoPlastic";

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    label: "Principal",
    items: [
      { to: HOME_PATH, label: "Inicio", icon: House, end: true },
      { to: getConfiguracionHref("analisis"), label: "Análisis", icon: ChartSpline },
      { to: "/candidatos", label: "Candidatos", icon: UserSearch, mobilePriority: true },
      { to: PLANTILLA_PATH, label: "Plantilla", icon: Contact },
      { to: "/resumen", label: "Resumen", icon: ChartNoAxesCombined, end: false, mobilePriority: true },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { to: "/actualizacion-datos", label: "Campaña", icon: UserRoundPen, roles: ["admin", "reclutador"] },
      { to: "/reportes", label: "Reporte Diario", icon: NotebookText },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: ACTIVIDADES_PATH, label: "Actividades", icon: ListTodo },
      { to: getConfiguracionHref("formatos"), label: "Formatos", icon: Files },
      { to: ADMINISTRATION_PATH, label: "Indicadores", icon: ChartNoAxesCombined },
      { to: getConfiguracionHref("rutas"), label: "Rutas", icon: Route },
      { to: getConfiguracionHref("tabulador"), label: "Tabulador", icon: BadgeDollarSign },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_SECTIONS.flatMap((section) => section.items);
