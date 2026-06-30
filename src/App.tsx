import { useState, useCallback, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
import { Toulouse } from '@/pages/Toulouse';
import { Bajas } from '@/pages/Bajas';
import { Empleados } from '@/pages/Empleados';
import { Transporte } from '@/pages/Transporte';
import { Rutas } from '@/pages/Rutas';
import { KpisPage } from '@/pages/KpisPage';
import { Login } from '@/pages/Login';
import { ReporteDiario } from '@/pages/ReporteDiario';

function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <PositionsProvider>
        <AppShell>{children}</AppShell>
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
      <Route path="/dashboard" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
      <Route path="/pipeline" element={<ProtectedShell><Pipeline /></ProtectedShell>} />
      <Route path="/vacantes" element={<ProtectedShell><Vacantes /></ProtectedShell>} />
      <Route path="/toulouse" element={<ProtectedShell><Toulouse /></ProtectedShell>} />
      <Route path="/bajas" element={<ProtectedShell><Bajas /></ProtectedShell>} />
      <Route path="/empleados" element={<ProtectedShell><Empleados /></ProtectedShell>} />
      <Route path="/transporte" element={<ProtectedShell><Transporte /></ProtectedShell>} />
      <Route path="/rutas" element={<ProtectedShell><Rutas /></ProtectedShell>} />
      <Route path="/reporte-diario" element={<ProtectedShell><ReporteDiario /></ProtectedShell>} />
      <Route path="/kpis" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;