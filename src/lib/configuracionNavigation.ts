import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  Files,
  Route,
  ChartSpline,
  type LucideIcon,
} from 'lucide-react';

export type FeatureId =
  | "analisis"
  | "indicadores"
  | "rutas"
  | "tabulador"
  | "formatos";

const FEATURE_PATHS: Record<FeatureId, string> = {
  analisis: '/analisis',
  formatos: '/formatos',
  indicadores: '/indicadores',
  rutas: '/rutas',
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
