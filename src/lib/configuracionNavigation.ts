import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  Files,
  MessagesSquare,
  Route,
  ScanSearch,
  type LucideIcon,
} from 'lucide-react';

export const CONFIGURACION_PATH = '/configuracion';
export const INCIDENCIAS_PATH = '/incidencias';

export type FeatureId =
  | "busqueda"
  | "indicadores"
  | "rutas"
  | "tabulador"
  | "speech"
  | "formatos";

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
      { id: "busqueda", label: "Búsqueda", icon: ScanSearch },
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

export const FEATURES: FeatureItem[] = FEATURE_GROUPS.flatMap(group => group.items);
export const CONFIGURACION_ROUTES = FEATURES.map(
  ({ id }) => `${CONFIGURACION_PATH}/${id}`,
);

export function getConfiguracionTab(pathname: string): FeatureId {
  const pathTab = pathname.startsWith(`${CONFIGURACION_PATH}/`)
    ? pathname.slice(CONFIGURACION_PATH.length + 1).split('/')[0]
    : null;
  const matchedPathTab = FEATURES.find(({ id }) => id === pathTab)?.id;
  return matchedPathTab ?? 'busqueda';
}

export function getConfiguracionHref(tab: FeatureId): string {
  return `${CONFIGURACION_PATH}/${tab}`;
}
