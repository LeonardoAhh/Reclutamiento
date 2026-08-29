import { lazy, Suspense, useState, useCallback, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
import { SplashTypewriter } from '@/components/ui/SplashTypewriter';
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

function ProtectedShell({ children }: { children: ReactNode }) {
  if (isBoneyardBuild()) {
    return (
      <PositionsProvider>
        <AppShell>{children}</AppShell>
      </PositionsProvider>
    );
  }

  return (
    <AuthGuard>
      <PositionsProvider>
        <MaintenanceGuard>
          <AppShell>{children}</AppShell>
          <TopRecruiterModal />
        </MaintenanceGuard>
      </PositionsProvider>
    </AuthGuard>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(isBoneyardBuild);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <>
      <AnimatePresence>
        {!splashDone && (
          <SplashTypewriter key="splash-typewriter" onDone={handleSplashDone} />
        )}
      </AnimatePresence>

      {splashDone && (
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
              <Route path="/resumen" element={<ProtectedShell><KpisPage /></ProtectedShell>} />
              <Route path="/plantilla" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
              <Route path="/candidatos" element={<ProtectedShell><Pipeline /></ProtectedShell>} />
              <Route path="/toulouse" element={<Navigate to="/configuracion" replace />} />
              <Route path="/bajas" element={<ProtectedShell><Bajas /></ProtectedShell>} />
              <Route path="/empleados" element={<Navigate to="/plantilla" replace />} />
              <Route path="/transporte" element={<Navigate to="/configuracion" replace />} />
              <Route path="/asistencia" element={<Navigate to="/configuracion" replace />} />
              <Route path="/rutas" element={<Navigate to="/configuracion" replace />} />
              <Route path="/reportes" element={<ProtectedShell><ReporteDiario /></ProtectedShell>} />
              <Route path="/actividades" element={<ProtectedShell><Actividades /></ProtectedShell>} />
              <Route path="/incidencias-transporte" element={<ProtectedShell><IncidenciasTransportePage /></ProtectedShell>} />
              <Route path="/perfil-general" element={<ProtectedShell><ProfileGeneral /></ProtectedShell>} />
              <Route path="/asistente" element={<ProtectedShell><AIChatPage /></ProtectedShell>} />
              <Route path="/documentos" element={<Navigate to="/configuracion" replace />} />
              <Route path="/configuracion" element={<ProtectedShell><Configuracion /></ProtectedShell>} />
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
      )}
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
