import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { CONFIGURACION_ROUTES, getConfiguracionHref } from '@/lib/configuracionNavigation';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import {
  ACCOUNT_PATH,
  ACTIVIDADES_PATH,
  CANDIDATES_PATH,
  HOME_PATH,
  ORGANIZATION_CHART_PATH,
  TEAM_PATH,
  VACANCY_ASSIGNMENTS_PATH,
} from '@/components/layout/navigation';
import { REPORT_COMPARISON_PATH } from '@/components/reporte-diario/navigation';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import { CAREER_PATH } from '@/features/career/types';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';

/** Las páginas de ruta no reciben props: toman sus datos del router y contexto. */
type AnyComponent = ComponentType;

export type PreloadableComponent<T extends AnyComponent> = LazyExoticComponent<T> & {
  /** Descarga el chunk sin renderizar. Idempotente; reintenta si falló. */
  preload: () => Promise<unknown>;
};

/**
 * `React.lazy` con precarga explícita: el menú pide el código al pasar el
 * cursor, enfocar o tocar un enlace, para que al navegar el chunk ya exista.
 */
export function lazyWithPreload<T extends AnyComponent>(
  load: () => Promise<{ default: T }>,
): PreloadableComponent<T> {
  let pending: Promise<{ default: T }> | null = null;
  const loadOnce = () => {
    pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
  const component = lazy(loadOnce) as PreloadableComponent<T>;
  component.preload = loadOnce;
  return component;
}

export const CareerPage = lazyWithPreload(() => import('@/features/career/CareerPage').then(({ CareerPage }) => ({ default: CareerPage })));
export const Dashboard = lazyWithPreload(() => import('@/pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
export const CandidateMetricsPage = lazyWithPreload(() => import('@/pages/CandidateMetricsPage').then(({ CandidateMetricsPage }) => ({ default: CandidateMetricsPage })));
export const Pipeline = lazyWithPreload(() => import('@/pages/Pipeline').then(({ Pipeline }) => ({ default: Pipeline })));
export const Bajas = lazyWithPreload(() => import('@/pages/Bajas').then(({ Bajas }) => ({ default: Bajas })));
export const KpisPage = lazyWithPreload(() => import('@/pages/KpisPage').then(({ KpisPage }) => ({ default: KpisPage })));
export const VacancyAssignmentsPage = lazyWithPreload(() => import('@/pages/VacancyAssignmentsPage').then(({ VacancyAssignmentsPage }) => ({ default: VacancyAssignmentsPage })));
export const ReportComparisonPage = lazyWithPreload(() => import('@/pages/ReportComparisonPage').then(({ ReportComparisonPage }) => ({ default: ReportComparisonPage })));
export const ReporteDiario = lazyWithPreload(() => import('@/pages/ReporteDiario').then(({ ReporteDiario }) => ({ default: ReporteDiario })));
export const MotivosBaja = lazyWithPreload(() => import('@/pages/MotivosBaja').then(({ MotivosBaja }) => ({ default: MotivosBaja })));
export const Configuracion = lazyWithPreload(() => import('@/pages/Configuracion').then(({ Configuracion }) => ({ default: Configuracion })));
export const Actividades = lazyWithPreload(() => import('@/pages/Actividades').then(({ Actividades }) => ({ default: Actividades })));
export const DataUpdatePage = lazyWithPreload(() => import('@/features/data-update/DataUpdatePage').then(({ DataUpdatePage }) => ({ default: DataUpdatePage })));
export const AccountPage = lazyWithPreload(() => import('@/pages/AccountPage').then(({ AccountPage }) => ({ default: AccountPage })));
export const TeamPage = lazyWithPreload(() => import('@/features/team/TeamPage').then(({ TeamPage }) => ({ default: TeamPage })));
export const LeaveRequestsPage = lazyWithPreload(() => import('@/pages/LeaveRequestsPage').then(({ LeaveRequestsPage }) => ({ default: LeaveRequestsPage })));
export const HomePage = lazyWithPreload(() => import('@/pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));
export const OrganizationChartPage = lazyWithPreload(() => import('@/pages/OrganizationChartPage').then(({ OrganizationChartPage }) => ({ default: OrganizationChartPage })));

interface RoutePage {
  matches: (pathname: string) => boolean;
  page: PreloadableComponent<AnyComponent>;
  /** Snapshot registrado en `src/bones/registry.ts`, si la ruta tiene uno. */
  bones?: string;
}

const exact = (path: string) => (pathname: string) => pathname === path;

const CONFIGURACION_BONES: Readonly<Record<string, string>> = {
  [getConfiguracionHref('analisis')]: 'analisis-page',
  [getConfiguracionHref('indicadores')]: 'configuracion-indicadores',
  [getConfiguracionHref('rutas')]: 'configuracion-rutas',
  [getConfiguracionHref('tabulador')]: 'configuracion-tabulador',
  [getConfiguracionHref('formatos')]: 'configuracion-formatos',
};

/** Orden relevante: las rutas exactas anidadas van antes que sus prefijos. */
const ROUTE_PAGES: readonly RoutePage[] = [
  { matches: exact(HOME_PATH), page: HomePage },
  { matches: exact(ORGANIZATION_CHART_PATH), page: OrganizationChartPage },
  { matches: exact(LEAVE_REQUESTS_PATH), page: LeaveRequestsPage, bones: 'leave-requests-page' },
  { matches: exact(CAREER_PATH), page: CareerPage },
  { matches: exact('/overview'), page: KpisPage, bones: 'resumen-page' },
  { matches: exact(PLANTILLA_PATH), page: Dashboard, bones: 'plantilla-page' },
  { matches: exact(VACANCY_ASSIGNMENTS_PATH), page: VacancyAssignmentsPage },
  { matches: exact(CANDIDATE_METRICS_PATH), page: CandidateMetricsPage },
  { matches: exact(CANDIDATES_PATH), page: Pipeline, bones: 'candidatos-page' },
  { matches: exact('/employee-turnover'), page: Bajas, bones: 'bajas-page' },
  { matches: exact(REPORT_COMPARISON_PATH), page: ReportComparisonPage },
  {
    matches: (pathname) => pathname === '/reports' || pathname.startsWith('/reports/'),
    page: ReporteDiario,
    bones: 'reportes-page',
  },
  { matches: exact('/departure-reasons'), page: MotivosBaja },
  { matches: exact(ACTIVIDADES_PATH), page: Actividades, bones: 'actividades-page' },
  { matches: exact(DATA_UPDATE_PATH), page: DataUpdatePage },
  { matches: exact(ACCOUNT_PATH), page: AccountPage },
  { matches: exact(TEAM_PATH), page: TeamPage },
  ...CONFIGURACION_ROUTES.map((path) => ({
    matches: exact(path),
    page: Configuracion,
    bones: CONFIGURACION_BONES[path],
  })),
];

function findRoutePage(pathname: string): RoutePage | undefined {
  return ROUTE_PAGES.find((route) => route.matches(pathname));
}

/** Precarga el código de la página destino; los errores se reintentan al navegar. */
export function preloadRoute(pathname: string): void {
  findRoutePage(pathname)?.page.preload().catch(() => undefined);
}

/** Nombre del snapshot Boneyard de la ruta, para el fallback dentro del layout. */
export function getRouteBones(pathname: string): string | undefined {
  return findRoutePage(pathname)?.bones;
}
