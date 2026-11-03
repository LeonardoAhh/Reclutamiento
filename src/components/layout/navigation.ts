import {
  ChartNoAxesCombined,
  Contact,
  Database,
  FilePenLine,
  House,
  ListTodo,
  NotebookText,
  Percent,
  Route,
  UserSearch,
  type LucideIcon,
} from 'lucide-react';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { DEPARTMENT_INCIDENCES_PATH, REPORTS_PATH } from '@/components/reporte-diario/navigation';
import type { Language } from '@/contexts/LanguageContext';

export type NavigationRole = 'admin' | 'reclutador';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: ReadonlyArray<NavigationRole>;
};

export type NavSection = {
  id: 'home' | 'recruitment' | 'people' | 'tracking';
  label: string;
  items: NavItem[];
};

export const ACTIVIDADES_PATH = '/activities';
export const ACCOUNT_PATH = '/account';
export const TEAM_PATH = '/team';
export const VACANCY_ASSIGNMENTS_PATH = '/vacancy-assignments';
export const HOME_PATH = '/home';
export const CANDIDATES_PATH = '/candidates';
const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    id: 'home',
    label: '',
    items: [{ to: HOME_PATH, label: 'Inicio', icon: House, end: true }],
  },
  {
    id: 'recruitment',
    label: 'Reclutamiento',
    items: [
      { to: CANDIDATES_PATH, label: 'Candidatos', icon: UserSearch },
      { to: '/data-update', label: 'Campaña', icon: Database, roles: ['admin', 'reclutador'] },
      { to: ACTIVIDADES_PATH, label: 'Actividades', icon: ListTodo },
      { to: getConfiguracionHref('formatos'), label: 'Formatos', icon: FilePenLine },
    ],
  },
  {
    id: 'people',
    label: 'Personal',
    items: [
      { to: PLANTILLA_PATH, label: 'Plantilla', icon: Contact },
      { to: '/overview', label: 'Resumen', icon: ChartNoAxesCombined },
    ],
  },
  {
    id: 'tracking',
    label: 'Seguimiento',
    items: [
      { to: REPORTS_PATH, label: 'Reporte Diario', icon: NotebookText, roles: ['admin'] },
      { to: DEPARTMENT_INCIDENCES_PATH, label: 'Incidencias', icon: Percent, roles: ['admin'] },
      { to: getConfiguracionHref('rutas'), label: 'Rutas', icon: Route },
    ],
  },
];

const ENGLISH_NAV_LABELS: Readonly<Record<string, string>> = {
  Reclutamiento: 'Recruitment',
  Personal: 'People',
  Seguimiento: 'Tracking',
  Inicio: 'Home',
  Análisis: 'Analysis',
  'Detalle del día': 'Day details',
  'Comparativa mensual': 'Monthly comparison',
  'Métricas y KPIs': 'Metrics and KPIs',
  Rotación: 'Turnover',
  'Motivos de baja': 'Reasons for leaving',
  'Actualización de datos': 'Data update',
  Cuenta: 'Account',
  Indicadores: 'Metrics',
  Tabulador: 'Pay scale',
  Candidatos: 'Candidates',
  Plantilla: 'Workforce',
  Resumen: 'Overview',
  Campaña: 'Data update',
  'Reporte Diario': 'Daily Report',
  Incidencias: 'Incidents',
  Actividades: 'Activities',
  Formatos: 'Forms',
  Rutas: 'Routes',
};

export function localizeNavigationText(language: Language, text: string): string {
  return language === 'en' ? (ENGLISH_NAV_LABELS[text] ?? text) : text;
}

export function getLocalizedNavigation(language: Language): NavSection[] {
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    label: localizeNavigationText(language, section.label),
    items: section.items.map((item) => ({
      ...item,
      label: localizeNavigationText(language, item.label),
    })),
  }));
  const collator = new Intl.Collator(language === 'en' ? 'en' : 'es', { sensitivity: 'base' });

  return sections.map((section) => ({
    ...section,
    items: [...section.items].sort((first, second) => collator.compare(first.label, second.label)),
  }));
}
