import {
  ChartNoAxesCombined,
  Contact,
  Database,
  FileChartColumnIncreasing,
  FilePenLine,
  House,
  ListTodo,
  NotebookText,
  Route,
  UserSearch,
  type LucideIcon,
} from 'lucide-react';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { getConfiguracionHref } from '@/lib/configuracionNavigation';
import { REPORTS_PATH } from '@/components/reporte-diario/navigation';
import { REPORT_SGI_LABEL, REPORT_SGI_PATH } from '@/pages/report-sgi/navigation';
import type { Language } from '@/contexts/LanguageContext';

export type NavigationRole = 'admin' | 'reclutador';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: ReadonlyArray<NavigationRole>;
};

export const ACTIVIDADES_PATH = '/activities';
export const ACCOUNT_PATH = '/account';
export const TEAM_PATH = '/team';
export const VACANCY_ASSIGNMENTS_PATH = '/vacancy-assignments';
export const HOME_PATH = '/home';
export const CANDIDATES_PATH = '/candidates';
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: HOME_PATH, label: 'Inicio', icon: House, end: true },
  { to: CANDIDATES_PATH, label: 'Candidatos', icon: UserSearch },
  { to: '/data-update', label: 'Campaña', icon: Database, roles: ['admin', 'reclutador'] },
  { to: ACTIVIDADES_PATH, label: 'Actividades', icon: ListTodo },
  { to: getConfiguracionHref('formatos'), label: 'Formatos', icon: FilePenLine },
  { to: PLANTILLA_PATH, label: 'Plantilla', icon: Contact },
  { to: '/overview', label: 'Resumen', icon: ChartNoAxesCombined },
  { to: REPORTS_PATH, label: 'Reporte Diario', icon: NotebookText, roles: ['admin'] },
  { to: REPORT_SGI_PATH, label: REPORT_SGI_LABEL, icon: FileChartColumnIncreasing },
  { to: getConfiguracionHref('rutas'), label: 'Rutas', icon: Route },
];

const ENGLISH_NAV_LABELS: Readonly<Record<string, string>> = {
  Inicio: 'Home',
  Análisis: 'Analysis',
  'Detalle del día': 'Day details',
  'Comparativa mensual': 'Monthly comparison',
  'Métricas y KPIs': 'Metrics and KPIs',
  'Analisis T3': 'Q3 Analysis',
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

export function getLocalizedNavigation(language: Language): NavItem[] {
  const items = NAV_ITEMS.map((item) => ({
    ...item,
    label: localizeNavigationText(language, item.label),
  }));
  const collator = new Intl.Collator(language === 'en' ? 'en' : 'es', { sensitivity: 'base' });
  const homeItem = items.find((item) => item.to === HOME_PATH);

  return [
    ...(homeItem ? [homeItem] : []),
    ...items
      .filter((item) => item.to !== HOME_PATH)
      .sort((first, second) => collator.compare(first.label, second.label)),
  ];
}
