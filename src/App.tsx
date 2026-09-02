import { lazy, Suspense, useState, useCallback, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { PWAStatus } from '@/components/ui/PWAStatus';
import { SystemUpdateNotification } from '@/components/ui/SystemUpdateNotification';

import { AppToaster } from '@/components/ui/AppToaster';
import { ThemeTransitionOverlay } from '@/components/ui/ThemeTransitionOverlay';
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
import { isBoneyardBuild } from '@/lib/boneyard';

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
const Configuracion = lazy(() =>
  import('@/pages/Configuracion').then(({ Configuracion }) => ({
    default: Configuracion,
  })),
);
const ReporteTransportePublic = lazy(() =>
  import('@/pages/ReporteTransportePublic').then(
    ({ ReporteTransportePublic }) => ({ default: ReporteTransportePublic }),
  ),
);
const Actividades = lazy(() =>
  import('@/pages/Actividades').then(({ Actividades }) => ({
    default: Actividades,
  })),
);
const ProfileGeneral = lazy(() =>
  import('@/pages/ProfileGeneral').then(({ ProfileGeneral }) => ({
    default: ProfileGeneral,
  })),
);
const AIChatPage = lazy(() =>
  import('@/pages/AIChatPage').then(({ AIChatPage }) => ({
    default: AIChatPage,
  })),
);
const IncidenciasTransportePage = lazy(() =>
  import('@/pages/IncidenciasTransportePage').then(({ IncidenciasTransportePage }) => ({
    default: IncidenciasTransportePage,
  })),
);

function ProtectedContent() {
  return (
    <CandidatesProvider>
      <PositionsProvider>
        <MaintenanceGuard>
          <AppShell><Outlet /></AppShell>
          <TopRecruiterModal />
        </MaintenanceGuard>
      </PositionsProvider>
    </CandidatesProvider>
  );
}

function ProtectedShell() {
  if (isBoneyardBuild()) {
    return (
      <CandidatesProvider>
        <PositionsProvider>
          <AppShell><Outlet /></AppShell>
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

function App() {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <>
        <>
          <PWAStatus />
          <SystemUpdateNotification />
          <AppToaster />
          <ThemeTransitionOverlay />
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
              <Route path="/reporte" element={<ReporteTransportePublic />} />
              <Route element={<ProtectedShell />}>
                <Route path="/resumen" element={<WithSupabaseData resources={WORKFORCE_DATA}><KpisPage /></WithSupabaseData>} />
                <Route path="/plantilla" element={<WithSupabaseData resources={WORKFORCE_DATA}><Dashboard /></WithSupabaseData>} />
                <Route path="/candidatos" element={<WithSupabaseData resources={CANDIDATE_FORM_DATA}><Pipeline /></WithSupabaseData>} />
                <Route path="/toulouse" element={<Navigate to="/configuracion" replace />} />
                <Route path="/bajas" element={<WithSupabaseData resources={EMPLOYEE_DATA}><Bajas /></WithSupabaseData>} />
                <Route path="/empleados" element={<Navigate to="/plantilla" replace />} />
                <Route path="/transporte" element={<Navigate to="/configuracion" replace />} />
                <Route path="/asistencia" element={<Navigate to="/configuracion" replace />} />
                <Route path="/rutas" element={<Navigate to="/configuracion" replace />} />
                <Route path="/reportes" element={<ReporteDiario />} />
                <Route path="/actividades" element={<Actividades />} />
                <Route path="/incidencias-transporte" element={<IncidenciasTransportePage />} />
                <Route path="/perfil-general" element={<WithSupabaseData resources={EMPLOYEE_DATA}><ProfileGeneral /></WithSupabaseData>} />
                <Route path="/asistente" element={<AIChatPage />} />
                <Route path="/documentos" element={<Navigate to="/configuracion" replace />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>
              <Route path="/features" element={<Navigate to="/configuracion" replace />} />
              <Route path="/dashboard" element={<Navigate to="/plantilla" replace />} />
              <Route path="/pipeline" element={<Navigate to="/candidatos" replace />} />
              <Route path="/reporte-diario" element={<Navigate to="/reportes" replace />} />
              <Route path="/kpis" element={<Navigate to="/resumen" replace />} />
              <Route path="/" element={<Navigate to="/resumen" replace />} />
              <Route path="*" element={<Navigate to="/resumen" replace />} />
            </Routes>
          </Suspense>
        </>
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
