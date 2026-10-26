import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChartSpline,
  Columns3,
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
import { KANBAN_PATH } from "@/features/kanban/types";
import { REPORTS_PATH } from "@/components/reporte-diario/navigation";
import type { Language } from "@/contexts/LanguageContext";

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
  id: "home" | "recruitment" | "people" | "tracking";
  label: string;
  items: NavItem[];
};

export const ACTIVIDADES_PATH = "/activities";
export const ACCOUNT_PATH = "/account";
export const TEAM_PATH = "/team";
export const LOGOUT_PATH = "/logout";
export const VACANCY_ASSIGNMENTS_PATH = "/vacancy-assignments";
export const HOME_PATH = "/home";
export const CANDIDATES_PATH = "/candidates";
export const ORGANIZATION_CHART_PATH = "/organization-chart";
export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    id: "home",
    label: "",
    items: [
      { to: HOME_PATH, label: "Inicio", icon: House, end: true },
    ],
  },
  {
    id: "recruitment",
    label: "Reclutamiento",
    items: [
      { to: CANDIDATES_PATH, label: "Candidatos", icon: UserSearch, mobilePriority: true },
      { to: "/data-update", label: "Campaña", icon: UserRoundPen, roles: ["admin", "reclutador"] },
      { to: KANBAN_PATH, label: "Kanban", icon: Columns3, roles: ["reclutador"] },
      { to: ACTIVIDADES_PATH, label: "Actividades", icon: ListTodo },
      { to: getConfiguracionHref("formatos"), label: "Formatos", icon: Files },
    ],
  },
  {
    id: "people",
    label: "Personal",
    items: [
      { to: PLANTILLA_PATH, label: "Plantilla", icon: Contact },
      { to: "/overview", label: "Resumen", icon: ChartNoAxesCombined, end: false, mobilePriority: true },
      { to: getConfiguracionHref("tabulador"), label: "Tabulador", icon: BadgeDollarSign },
    ],
  },
  {
    id: "tracking",
    label: "Seguimiento",
    items: [
      { to: getConfiguracionHref("analisis"), label: "Análisis", icon: ChartSpline },
      { to: REPORTS_PATH, label: "Reporte Diario", icon: NotebookText, roles: ["admin"] },
      { to: ADMINISTRATION_PATH, label: "Indicadores", icon: ChartNoAxesCombined, roles: ["admin"] },
      { to: getConfiguracionHref("rutas"), label: "Rutas", icon: Route },
    ],
  },
];

export const NAV_ITEMS: ReadonlyArray<NavItem> = NAV_SECTIONS.flatMap((section) => section.items);

const ENGLISH_NAV_LABELS: Readonly<Record<string, string>> = {
  Reclutamiento: "Recruitment",
  Personal: "People",
  Seguimiento: "Tracking",
  Inicio: "Home",
  Análisis: "Analysis",
  Candidatos: "Candidates",
  Plantilla: "Workforce",
  Resumen: "Overview",
  Campaña: "Data update",
  "Reporte Diario": "Daily Report",
  Actividades: "Activities",
  Formatos: "Forms",
  Indicadores: "Metrics",
  Rutas: "Routes",
  Tabulador: "Pay Scale",
};

export function getLocalizedNavigation(language: Language): NavSection[] {
  if (language === "es") return NAV_SECTIONS.map((section) => ({ ...section, items: [...section.items] }));
  return NAV_SECTIONS.map((section) => ({
    ...section,
    label: ENGLISH_NAV_LABELS[section.label] ?? section.label,
    items: section.items.map((item) => ({
      ...item,
      label: ENGLISH_NAV_LABELS[item.label] ?? item.label,
    })),
  }));
}
