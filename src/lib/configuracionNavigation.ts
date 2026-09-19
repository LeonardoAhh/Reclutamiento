import {
  BadgeDollarSign,
  CalendarClock,
  ChartNoAxesCombined,
  Files,
  MessagesSquare,
  Route,
  ChartSpline,
  type LucideIcon,
} from 'lucide-react';

export const HORARIOS_PATH = '/horarios/index.html';

export type FeatureId =
  | "analisis"
  | "indicadores"
  | "rutas"
  | "tabulador"
  | "speech"
  | "formatos";

const FEATURE_PATHS: Record<FeatureId, string> = {
  analisis: '/analisis',
  formatos: '/formatos',
  indicadores: '/indicadores',
  rutas: '/rutas',
  speech: '/speech',
  tabulador: '/tabulador',
};

export const ADMINISTRATION_PATH = FEATURE_PATHS.indicadores;

interface FeatureItem {
  id: FeatureId;
  label: string;
  icon: LucideIcon;
}

export type FeatureGroup = {
  title?: string;
  items: FeatureItem[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Principal",
    items: [
      { id: "analisis", label: "Análisis", icon: ChartSpline },
      { id: "formatos", label: "Formatos", icon: Files },
      { id: "rutas", label: "Rutas", icon: Route },
      { id: "speech", label: "Speech WA", icon: MessagesSquare },
    ],
  },
  {
    title: "Administración",
    items: [
      { id: "indicadores", label: "Indicadores", icon: ChartNoAxesCombined },
      { id: "tabulador", label: "Tabulador", icon: BadgeDollarSign },
    ],
  }
];

export const CONFIGURACION_OPERATION_LINKS = [
  {
    id: 'horarios',
    label: 'Horarios',
    icon: CalendarClock,
    href: HORARIOS_PATH,
    external: true,
  },
  {
    id: 'rutas',
    label: 'Rutas',
    icon: Route,
    href: FEATURE_PATHS.rutas,
  },
] as const;

export const FEATURES: FeatureItem[] = FEATURE_GROUPS.flatMap(group => group.items);
export const CONFIGURACION_ROUTES = FEATURES.map(
  ({ id }) => FEATURE_PATHS[id],
);

export function getConfiguracionTab(pathname: string): FeatureId {
  return FEATURES.find(({ id }) => FEATURE_PATHS[id] === pathname)?.id ?? 'analisis';
}

export function getConfiguracionHref(tab: FeatureId): string {
  return FEATURE_PATHS[tab];
}
