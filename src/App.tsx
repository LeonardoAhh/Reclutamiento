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
import {
  EMPLEADOS_PATH,
  PLANTILLA_PATH,
} from '@/lib/plantillaNavigation';
import { CONFIGURACION_ROUTES } from '@/lib/configuracionNavigation';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import { ACCOUNT_PATH, HOME_PATH, LOGOUT_PATH, TEAM_PATH } from '@/components/layout/navigation';
import { LogoutPage } from '@/features/account/LogoutPage';
import { CAREER_PATH } from '@/features/career/types';

const CareerPage = lazy(() => import('@/features/career/CareerPage').then(({ CareerPage }) => ({ default: CareerPage })));

const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })),
);
const Pipeline = lazy(() =>
  import('@/pages/Pipeline').then(({ Pipeline }) => ({ default: Pipeline })),
);
const Bajas = lazy(() =>
  import('@/pages/Bajas').then(({ Bajas }) => ({ default: Bajas })),
);
const KpisPage = lazy(() =>
  import('@/pages/KpisPage').then(({ KpisPage }) => ({ default: KpisPage })),
);
const Login = lazy(() =>
  import('@/pages/Login').then(({ Login }) => ({ default: Login })),
);
const ReporteDiario = lazy(() =>
  import('@/pages/ReporteDiario').then(({ ReporteDiario }) => ({
    default: ReporteDiario,
  })),
);
const MotivosBaja = lazy(() =>
  import('@/pages/MotivosBaja').then(({ MotivosBaja }) => ({
    default: MotivosBaja,
  })),
);
const Configuracion = lazy(() =>
  import('@/pages/Configuracion').then(({ Configuracion }) => ({
    default: Configuracion,
  })),
);
const Actividades = lazy(() =>
  import('@/pages/Actividades').then(({ Actividades }) => ({
    default: Actividades,
  })),
);
const DataUpdatePage = lazy(() =>
  import('@/features/data-update/DataUpdatePage').then(({ DataUpdatePage }) => ({
    default: DataUpdatePage,
  })),
);
const AccountPage = lazy(() =>
  import('@/pages/AccountPage').then(({ AccountPage }) => ({
    default: AccountPage,
  })),
);
const TeamPage = lazy(() => import('@/features/team/TeamPage').then(({ TeamPage }) => ({ default: TeamPage })));
const HomePage = lazy(() =>
  import('@/pages/HomePage').then(({ HomePage }) => ({
    default: HomePage,
  })),
);
function ProtectedContent() {
  const { pathname } = useLocation();
  return (
    <CandidatesProvider>
      <PositionsProvider>
        <MaintenanceGuard>
          <TeamProvider>{pathname === CAREER_PATH
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
          <TeamProvider>{pathname === CAREER_PATH ? <Outlet /> : <AppShell><Outlet /></AppShell>}</TeamProvider>
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

function App() {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <>
        <>
          <PWAStatus />
          <SystemUpdateNotification />
          <AppToaster />
          <Suspense fallback={<TransitionLoader title="Cargando vista…" />}>
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
                <Route path={CAREER_PATH} element={<CareerPage />} />
                <Route path="/resumen" element={<WithSupabaseData resources={WORKFORCE_DATA}><KpisPage /></WithSupabaseData>} />
                <Route path={PLANTILLA_PATH} element={<PlantillaPage />} />
                <Route path="/candidatos" element={<WithSupabaseData resources={CANDIDATE_FORM_DATA}><Pipeline /></WithSupabaseData>} />
                <Route path="/toulouse" element={<Navigate to="/analisis" replace />} />
                <Route path="/bajas" element={<WithSupabaseData resources={EMPLOYEE_DATA}><Bajas /></WithSupabaseData>} />
                <Route path={EMPLEADOS_PATH} element={<Navigate to={PLANTILLA_PATH} replace />} />
                <Route path="/transporte" element={<Navigate to="/rutas" replace />} />
                <Route path="/asistencia" element={<Navigate to="/analisis" replace />} />
                <Route path="/reportes" element={<ReporteDiario />} />
                <Route path="/motivos-baja" element={<MotivosBaja />} />
                <Route path="/reportes/motivos-baja" element={<Navigate to="/motivos-baja" replace />} />
                <Route path="/actividades" element={<Actividades />} />
                <Route path="/documentos" element={<Navigate to="/formatos" replace />} />
                <Route path={DATA_UPDATE_PATH} element={<DataUpdatePage />} />
                <Route path={ACCOUNT_PATH} element={<AccountPage />} />
                <Route path={TEAM_PATH} element={<TeamPage />} />
                {CONFIGURACION_ROUTES.map((path) => (
                  <Route key={path} path={path} element={<Configuracion />} />
                ))}
              </Route>
              <Route path="/features" element={<Navigate to="/analisis" replace />} />
              <Route path="/dashboard" element={<Navigate to="/plantilla" replace />} />
              <Route path="/pipeline" element={<Navigate to="/candidatos" replace />} />
              <Route path="/reporte-diario" element={<Navigate to="/reportes" replace />} />
              <Route path="/kpis" element={<Navigate to="/resumen" replace />} />
              <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
              <Route path="*" element={<Navigate to="/resumen" replace />} />
            </Routes>
          </Suspense>
        </>
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
