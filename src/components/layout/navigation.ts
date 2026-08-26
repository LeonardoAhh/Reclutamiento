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

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: "/actividades", label: "Actividades", icon: ClipboardList },
  { to: "/asistente", label: "Asistente", icon: Bot, mobilePriority: true },
  {
    to: "/candidatos",
    label: "Candidatos",
    icon: Contact,
    mobilePriority: true,
  },
  { to: "/configuracion", label: "Configuración", icon: SlidersHorizontal },
  { to: "/perfil-general", label: "Perfil General", icon: ClipboardCheck },
  { to: "/plantilla", label: "Plantilla", icon: Building2 },
  { to: "/reportes", label: "Reporte Diario", icon: Calendar },
  {
    to: "/resumen",
    label: "Resumen",
    icon: LayoutGrid,
    end: false,
    mobilePriority: true,
  },
];
