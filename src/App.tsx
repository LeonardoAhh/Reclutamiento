import { useState, useCallback, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoaderOverlay } from '@/components/ui/LoaderOverlay';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { PWAStatus } from '@/components/ui/PWAStatus';
import { SystemUpdateBanner } from '@/components/ui/SystemUpdateBanner';
import { AppToaster } from '@/components/ui/AppToaster';
import { ThemeTransitionOverlay } from '@/components/ui/ThemeTransitionOverlay';
import { AuthGuard, RedirectIfAuthed } from '@/components/auth/AuthGuard';
import { PositionsProvider } from '@/lib/positions';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { Dashboard } from '@/pages/Dashboard';
import { Pipeline } from '@/pages/Pipeline';
import { Vacantes } from '@/pages/Vacantes';
import { Bajas } from '@/pages/Bajas';
import { Transporte } from '@/pages/Transporte';
import { KpisPage } from '@/pages/KpisPage';
import { Login } from '@/pages/Login';
import { ReporteDiario } from '@/pages/ReporteDiario';
import { Configuracion } from '@/pages/Configuracion';
import { TopRecruiterModal } from '@/components/ui/TopRecruiterModal';

function AdminGuard({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading || !profile) return <LoaderOverlay tone="route" />;
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <PositionsProvider>
        <AppShell>{children}</AppShell>
        <TopRecruiterModal />
      </PositionsProvider>
    </AuthGuard>
  );
}

function App() {
  /* La splash se muestra una sola vez por sesión de pestaña. */
  const [splashDone, setSplashDone] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('splash_shown') === '1'
  );

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('splash_shown', '1');
    setSplashDone(true);
  }, []);

  return (
    <>
      {/* Splash: aparece sobre todo hasta que se complete */}
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen key="splash" onDone={handleSplashDone} />
        )}
      </AnimatePresence>

      <PWAStatus />
      <SystemUpdateBanner />
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
      <Route path="/" element={<ProtectedShell><KpisPage /></ProtectedShell>} />
      <Route path="/plantilla" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
      <Route path="/pipeline" element={<ProtectedShell><Pipeline /></ProtectedShell>} />
      <Route path="/vacantes" element={<ProtectedShell><Vacantes /></ProtectedShell>} />
      <Route path="/toulouse" element={<Navigate to="/features" replace />} />
      <Route path="/bajas" element={<ProtectedShell><Bajas /></ProtectedShell>} />
      <Route path="/empleados" element={<Navigate to="/plantilla" replace />} />
      <Route path="/transporte" element={<ProtectedShell><Transporte /></ProtectedShell>} />
      <Route path="/rutas" element={<Navigate to="/features" replace />} />
      <Route path="/reporte-diario" element={<ProtectedShell><ReporteDiario /></ProtectedShell>} />
      <Route path="/documentos" element={<Navigate to="/features" replace />} />
      <Route path="/features" element={<ProtectedShell><Configuracion /></ProtectedShell>} />
      <Route path="/configuracion" element={<Navigate to="/features" replace />} />
      <Route path="/dashboard" element={<Navigate to="/plantilla" replace />} />
      <Route path="/kpis" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;