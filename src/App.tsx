import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { AppShell } from '@/components/layout/AppShell';
import { StatusPage } from '@/components/ui/StatusPage';
import { useAuth } from '@/hooks/useAuth';
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

import { TeamProvider } from '@/features/team/TeamProvider';
import { isBoneyardBuild } from '@/lib/boneyard';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { ADMINISTRATION_PATH, CONFIGURACION_ROUTES, getConfiguracionHref, ROUTE_DAY_EMPLOYEES_PATH, ROUTE_SCANNER_PATH } from '@/lib/configuracionNavigation';
import { RutaDayEmployeesPage } from '@/components/ui/RutaDayEmployeesModal';
import { RouteScannerPage } from '@/pages/configuracion-views/RouteScannerPage';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import { ACCOUNT_PATH, ACTIVIDADES_PATH, HOME_PATH, TEAM_PATH, VACANCY_ASSIGNMENTS_PATH } from '@/components/layout/navigation';
import { DEPARTURE_REASONS_PATH, REPORT_COMPARISON_PATH, REPORT_DAY_ROUTE, REPORTS_PATH, isDailyReportPath } from '@/components/reporte-diario/navigation';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { ACTIVITY_IMAGE_ROUTE } from '@/pages/activityImageNavigation';
import { REPORT_SGI_PATH } from '@/pages/report-sgi/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LAYOUT_BREAKPOINTS } from '@/lib/layout';
import {
  AccountPage,
  Actividades,
  ActivityImagePage,
  Bajas,
  CandidateMetricsPage,
  Configuracion,
  Dashboard,
  DataUpdatePage,
  HomePage,
  KpisPage,
  LeaveRequestsPage,
  MotivosBaja,
  Pipeline,
  ReportComparisonPage,
  ReporteDiario,
  ReportSgiPage,
} from '@/lib/routePages';

const Login = lazy(() =>
  import('@/pages/Login').then(({ Login }) => ({ default: Login })),
);

function ProtectedContent({ accountModal, onCloseAccount }: { accountModal: boolean; onCloseAccount: () => void }) {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const normalizedPath = pathname.replace(/\/+$/, '');
  const recruiterRestrictedPath = pathname === ADMINISTRATION_PATH
    || normalizedPath === getConfiguracionHref('analisis')
    || normalizedPath === CANDIDATE_METRICS_PATH
    || isDailyReportPath(pathname);
  if (profile?.role === 'reclutador' && recruiterRestrictedPath) {
    return <Navigate to={HOME_PATH} replace />;
  }
  return (
    <CandidatesProvider>
      <PositionsProvider>
        <MaintenanceGuard>
          <TeamProvider>
            <AppShell accountModal={accountModal} onCloseAccount={onCloseAccount}><Outlet /></AppShell>
          </TeamProvider>
        </MaintenanceGuard>
      </PositionsProvider>
    </CandidatesProvider>
  );
}

function ProtectedShell({ accountModal, onCloseAccount }: { accountModal: boolean; onCloseAccount: () => void }) {
  if (isBoneyardBuild()) {
    return (
      <CandidatesProvider>
        <PositionsProvider>
          <TeamProvider><AppShell accountModal={accountModal} onCloseAccount={onCloseAccount}><Outlet /></AppShell></TeamProvider>
        </PositionsProvider>
      </CandidatesProvider>
    );
  }

  return (
    <AuthGuard>
      <ProtectedContent accountModal={accountModal} onCloseAccount={onCloseAccount} />
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

function SessionExpiredRoute() {
  const { session, sessionExpired, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to={HOME_PATH} replace />;
  if (!sessionExpired) return <Navigate to="/login" replace />;
  return <StatusPage kind="expired" standalone />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabletOrLarger = useMediaQuery(`(min-width: ${LAYOUT_BREAKPOINTS.tablet}px)`);
  const routeState: unknown = location.state;
  const savedLocation = routeState && typeof routeState === 'object' && 'accountBackgroundLocation' in routeState
    ? routeState.accountBackgroundLocation
    : null;
  const previousLocation = savedLocation && typeof savedLocation === 'object' && 'pathname' in savedLocation
    && typeof savedLocation.pathname === 'string' && savedLocation.pathname.startsWith('/')
    && savedLocation.pathname !== ACCOUNT_PATH && savedLocation.pathname !== '/login'
    ? savedLocation as Location
    : null;
  const accountModal = tabletOrLarger && location.pathname === ACCOUNT_PATH;
  const backgroundLocation = accountModal
    ? previousLocation ?? { ...location, pathname: HOME_PATH, search: '', hash: '', state: null }
    : undefined;
  const closeAccount = () => navigate(backgroundLocation ?? HOME_PATH, { replace: true });
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <>
          <PWAStatus />
          <SystemUpdateNotification />
          <AppToaster />
          <Suspense fallback={<AppLoadingFallback />}>
            <Routes location={backgroundLocation ?? location}>
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <Login />
                  </RedirectIfAuthed>
                }
              />
              <Route path="/session-expired" element={<SessionExpiredRoute />} />
              <Route element={<ProtectedShell accountModal={accountModal} onCloseAccount={closeAccount} />}>
                <Route path={HOME_PATH} element={<HomePage />} />
                <Route path={LEAVE_REQUESTS_PATH} element={<LeaveRequestsPage />} />
                <Route path="/overview" element={<WithSupabaseData resources={WORKFORCE_DATA}><KpisPage /></WithSupabaseData>} />
                <Route path={PLANTILLA_PATH} element={<PlantillaPage />} />
                <Route path={VACANCY_ASSIGNMENTS_PATH} element={<Navigate to={PLANTILLA_PATH} replace />} />
                <Route path={CANDIDATE_METRICS_PATH} element={<CandidateMetricsPage />} />
                <Route path="/candidates" element={<WithSupabaseData resources={CANDIDATE_FORM_DATA}><Pipeline /></WithSupabaseData>} />
                <Route path="/employee-turnover" element={<WithSupabaseData resources={EMPLOYEE_DATA}><Bajas /></WithSupabaseData>} />
                <Route path={ROUTE_DAY_EMPLOYEES_PATH} element={<RutaDayEmployeesPage />} />
                <Route path={ROUTE_SCANNER_PATH} element={<RouteScannerPage />} />
                <Route path={REPORT_COMPARISON_PATH} element={<ReportComparisonPage />} />
                <Route path={REPORT_SGI_PATH} element={<WithSupabaseData resources={EMPLOYEE_DATA}><ReportSgiPage /></WithSupabaseData>} />
                <Route path="/report-sgi" element={<Navigate to={REPORT_SGI_PATH} replace />} />
                <Route path={REPORTS_PATH} element={<ReporteDiario />}>
                  <Route path={REPORT_DAY_ROUTE} element={null} />
                </Route>
                <Route path={DEPARTURE_REASONS_PATH} element={<MotivosBaja />} />
                <Route path={ACTIVIDADES_PATH} element={<Actividades />} />
                <Route path={ACTIVITY_IMAGE_ROUTE} element={<ActivityImagePage />} />
                <Route path={DATA_UPDATE_PATH} element={<DataUpdatePage />} />
                <Route path={ACCOUNT_PATH} element={<AccountPage />} />
                <Route path={TEAM_PATH} element={<Navigate to={ACCOUNT_PATH} replace />} />
                {CONFIGURACION_ROUTES.map((path) => (
                  <Route key={path} path={path} element={<Configuracion />} />
                ))}
                <Route path="*" element={<StatusPage kind="not-found" />} />
              </Route>
              <Route path="/features" element={<Navigate to="/analysis" replace />} />
              <Route path="/dashboard" element={<Navigate to={PLANTILLA_PATH} replace />} />
              <Route path="/pipeline" element={<Navigate to="/candidates" replace />} />
              <Route path="/kpis" element={<Navigate to="/overview" replace />} />
              <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
            </Routes>
          </Suspense>
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
