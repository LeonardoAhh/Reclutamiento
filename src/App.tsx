import { useState, useCallback, type ReactNode } from 'react';
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
import { Dashboard } from '@/pages/Dashboard';
import { Pipeline } from '@/pages/Pipeline';
import { Bajas } from '@/pages/Bajas';
import { KpisPage } from '@/pages/KpisPage';
import { Login } from '@/pages/Login';
import { ReporteDiario } from '@/pages/ReporteDiario';
import { Configuracion } from '@/pages/Configuracion';
import { ReporteTransportePublic } from '@/pages/ReporteTransportePublic';
import { Actividades } from '@/pages/Actividades';

import { TopRecruiterModal } from '@/components/ui/TopRecruiterModal';
import { AIChatPage } from '@/pages/AIChatPage';
import { isBoneyardBuild } from '@/lib/boneyard';

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
        </>
      )}
      </>
    </TooltipPrimitive.Provider>
  );
}

export default App;
