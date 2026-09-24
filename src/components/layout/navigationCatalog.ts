import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChartSpline,
  ContactRound,
  Files,
  ListTodo,
  MessagesSquare,
  Network,
  type LucideIcon,
} from 'lucide-react';
import {
  CONFIGURACION_OPERATION_LINKS,
  getConfiguracionHref,
} from '@/lib/configuracionNavigation';
import { getPlantillaHref } from '@/lib/plantillaNavigation';
import { ACTIVIDADES_PATH } from './navigation';

export type NavigationChild = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  external?: boolean;
};

export type NavigationChildGroup = {
  id: string;
  title?: string;
  items: ReadonlyArray<NavigationChild>;
};

export const PLANTILLA_NAV_GROUPS: ReadonlyArray<NavigationChildGroup> = [
  {
    id: 'plantilla',
    items: [
      {
        id: 'analisis',
        label: 'Análisis',
        icon: ChartSpline,
        href: getConfiguracionHref('analisis'),
      },
      {
        id: 'general',
        label: 'Departamentos',
        icon: Network,
        href: getPlantillaHref('general'),
      },
      {
        id: 'empleados',
        label: 'Empleados',
        icon: ContactRound,
        href: getPlantillaHref('empleados'),
      },
    ],
  },
];

export const ACTIVIDADES_NAV_GROUPS: ReadonlyArray<NavigationChildGroup> = [
  {
    id: 'actividades',
    items: [
      {
        id: 'actividades',
        label: 'Actividades',
        icon: ListTodo,
        href: ACTIVIDADES_PATH,
      },
      {
        id: 'formatos',
        label: 'Formatos',
        icon: Files,
        href: getConfiguracionHref('formatos'),
      },
      {
        id: 'speech',
        label: 'Speech WA',
        icon: MessagesSquare,
        href: getConfiguracionHref('speech'),
      },
    ],
  },
];

export const CONFIGURACION_NAV_GROUPS: ReadonlyArray<NavigationChildGroup> = [
  {
    id: 'administracion',
    items: [
      {
        id: 'indicadores',
        label: 'Indicadores',
        icon: ChartNoAxesCombined,
        href: getConfiguracionHref('indicadores'),
      },
      {
        id: 'tabulador',
        label: 'Tabulador',
        icon: BadgeDollarSign,
        href: getConfiguracionHref('tabulador'),
      },
      ...CONFIGURACION_OPERATION_LINKS.map((item) => ({ ...item })),
    ],
  },
];
