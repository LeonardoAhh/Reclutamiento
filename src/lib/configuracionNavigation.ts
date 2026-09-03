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

export function getConfiguracionTab(search: string): FeatureId {
  const tab = new URLSearchParams(search).get('tab');
  return FEATURES.find(({ id }) => id === tab)?.id ?? 'busqueda';
}

export function getConfiguracionHref(tab: FeatureId, search = ''): string {
  const params = new URLSearchParams(search);
  params.set('tab', tab);
  return `${CONFIGURACION_PATH}?${params.toString()}`;
}
