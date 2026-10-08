import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { AppShell } from '@/components/layout/AppShell';
import { PWAStatus } from '@/components/ui/PWAStatus';
import { SystemUpdateNotification } from '@/components/ui/SystemUpdateNotification';

import { AppToaster } from '@/components/ui/AppToaster';
import { AuthGuard, RedirectIfAuthed } from '@/components/auth/AuthGuard';
import { MaintenanceGuard } from '@/components/auth/MaintenanceGuard';
import { PositionsProvider } from '@/lib/positions';
import { CandidatesProvider } from '@/hooks/useCandidates';
import {
  SupabaseDataProvider,
  type SupabaseDataResource,
} from '@/hooks/useSupabaseData';
import { TransitionLoader } from '@/components/ui/TransitionLoader';

import { TopRecruiterModal } from '@/components/ui/TopRecruiterModal';
import { TeamProvider } from '@/features/team/TeamProvider';
import { isBoneyardBuild } from '@/lib/boneyard';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { CONFIGURACION_ROUTES, ROUTE_DAY_EMPLOYEES_PATH } from '@/lib/configuracionNavigation';
import { RutaDayEmployeesPage } from '@/components/ui/RutaDayEmployeesModal';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import { ACCOUNT_PATH, ACTIVIDADES_PATH, HOME_PATH, LOGOUT_PATH, ORGANIZATION_CHART_PATH, TEAM_PATH, VACANCY_ASSIGNMENTS_PATH } from '@/components/layout/navigation';
import { LogoutPage } from '@/features/account/LogoutPage';
import { REPORT_COMPARISON_PATH, REPORT_DAY_ROUTE } from '@/components/reporte-diario/navigation';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import { CAREER_JOURNEY_ENABLED, CAREER_PATH } from '@/features/career/types';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AccountPage,
  Actividades,
  Bajas,
  CandidateMetricsPage,
  CareerPage,
  Configuracion,
  Dashboard,
  DataUpdatePage,
  HomePage,
  KpisPage,
  LeaveRequestsPage,
  MotivosBaja,
  OrganizationChartPage,
  Pipeline,
  ReportComparisonPage,
  ReporteDiario,
  TeamPage,
  VacancyAssignmentsPage,
} from '@/lib/routePages';

const Login = lazy(() =>
  import('@/pages/Login').then(({ Login }) => ({ default: Login })),
);

function ProtectedContent() {
  const { pathname } = useLocation();
  return (
    <CandidatesProvider>
      <PositionsProvider>
        <MaintenanceGuard>
          <TeamProvider>{CAREER_JOURNEY_ENABLED && pathname === CAREER_PATH
            ? <Outlet />
            : <><AppShell><Outlet /></AppShell><TopRecruiterModal /></>}</TeamProvider>
        </MaintenanceGuard>
      </PositionsProvider>
    </CandidatesProvider>
  );
}

function ProtectedShell() {
  const { pathname } = useLocation();
  if (isBoneyardBuild()) {
    return (
      <CandidatesProvider>
        <PositionsProvider>
          <TeamProvider>{CAREER_JOURNEY_ENABLED && pathname === CAREER_PATH ? <Outlet /> : <AppShell><Outlet /></AppShell>}</TeamProvider>
        </PositionsProvider>
      </CandidatesProvider>
    );
  }

  return (
    <AuthGuard>
      <ProtectedContent />
    </AuthGuard>
  );
}

const EMPLOYEE_DATA: readonly SupabaseDataResource[] = ['employees'];
const WORKFORCE_DATA: readonly SupabaseDataResource[] = [
  'employees',
  'comments',
];
const CANDIDATE_FORM_DATA: readonly SupabaseDataResource[] = [
  'employees',
  'comments',
  'noCitados',
];

function WithSupabaseData({
  children,
  resources,
}: {
  children: ReactNode;
  resources: readonly SupabaseDataResource[];
}) {
  return (
    <SupabaseDataProvider resources={resources}>
      {children}
    </SupabaseDataProvider>
  );
}

function PlantillaPage() {
  return (
    <WithSupabaseData resources={WORKFORCE_DATA}>
      <Dashboard />
    </WithSupabaseData>
  );
}

function AppLoadingFallback() {
  const { language } = useLanguage();
  return (
    <TransitionLoader
      title={language === 'en' ? 'Loading page…' : 'Cargando página…'}
    />
  );
}

function App() {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <>
          <PWAStatus />
          <SystemUpdateNotification />
          <AppToaster />
          <Suspense fallback={<AppLoadingFallback />}>
            <Routes>
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <Login />
                  </RedirectIfAuthed>
                }
              />
              <Route path={LOGOUT_PATH} element={<AuthGuard><LogoutPage /></AuthGuard>} />
              <Route element={<ProtectedShell />}>
                <Route path={HOME_PATH} element={<HomePage />} />
                <Route path={ORGANIZATION_CHART_PATH} element={<OrganizationChartPage />} />
                <Route path={LEAVE_REQUESTS_PATH} element={<LeaveRequestsPage />} />
                <Route path={CAREER_PATH} element={CAREER_JOURNEY_ENABLED
                  ? <CareerPage /> : <Navigate to={HOME_PATH} replace />} />
                <Route path="/overview" element={<WithSupabaseData resources={WORKFORCE_DATA}><KpisPage /></WithSupabaseData>} />
                <Route path={PLANTILLA_PATH} element={<PlantillaPage />} />
                <Route path={VACANCY_ASSIGNMENTS_PATH} element={<WithSupabaseData resources={WORKFORCE_DATA}><VacancyAssignmentsPage /></WithSupabaseData>} />
                <Route path={CANDIDATE_METRICS_PATH} element={<CandidateMetricsPage />} />
                <Route path="/candidates" element={<WithSupabaseData resources={CANDIDATE_FORM_DATA}><Pipeline /></WithSupabaseData>} />
                <Route path="/employee-turnover" element={<WithSupabaseData resources={EMPLOYEE_DATA}><Bajas /></WithSupabaseData>} />
                <Route path={ROUTE_DAY_EMPLOYEES_PATH} element={<RutaDayEmployeesPage />} />
                <Route path={REPORT_COMPARISON_PATH} element={<ReportComparisonPage />} />
                <Route path="/reports" element={<ReporteDiario />}>
                  <Route path={REPORT_DAY_ROUTE} element={null} />
                </Route>
                <Route path="/departure-reasons" element={<MotivosBaja />} />
                <Route path={ACTIVIDADES_PATH} element={<Actividades />} />
                <Route path={DATA_UPDATE_PATH} element={<DataUpdatePage />} />
                <Route path={ACCOUNT_PATH} element={<AccountPage />} />
                <Route path={TEAM_PATH} element={<TeamPage />} />
                {CONFIGURACION_ROUTES.map((path) => (
                  <Route key={path} path={path} element={<Configuracion />} />
                ))}
              </Route>
              <Route path="/features" element={<Navigate to="/analysis" replace />} />
              <Route path="/dashboard" element={<Navigate to={PLANTILLA_PATH} replace />} />
              <Route path="/pipeline" element={<Navigate to="/candidates" replace />} />
              <Route path="/kpis" element={<Navigate to="/overview" replace />} />
              <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
              <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
            </Routes>
          </Suspense>
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
