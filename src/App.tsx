import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLoader } from '@/hooks/useLoader';
import { Header } from '@/components/layout/Header';
import { PWAStatus } from '@/components/ui/PWAStatus';
import { ThemeTransitionOverlay } from '@/components/ui/ThemeTransitionOverlay';
import { AuthGuard, RedirectIfAuthed } from '@/components/auth/AuthGuard';
import { PositionsProvider } from '@/lib/positions';
import { Dashboard } from '@/pages/Dashboard';
import { Pipeline } from '@/pages/Pipeline';
import { Vacantes } from '@/pages/Vacantes';
import { Bajas } from '@/pages/Bajas';
import { Empleados } from '@/pages/Empleados';
import { Transporte } from '@/pages/Transporte';
import { Rutas } from '@/pages/Rutas';
import { KpisPage } from '@/pages/KpisPage';
import { Login } from '@/pages/Login';
import { ReporteDiario } from '@/pages/ReporteDiario';
// NOTE: Settings page deshabilitada temporalmente — ni ruta ni botón.
// Cuando se retome, restaurar import + ruta + item en UserMenu.
// import { Settings } from '@/pages/Settings';

/**
 * Shell con Header + página protegida. El Header sólo se monta dentro del
 * área autenticada para que el login se sienta como una pantalla aparte.
 */
function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <PositionsProvider>
        <Header />
        {children}
      </PositionsProvider>
    </AuthGuard>
  );
}

/**
 * Dispara un flash del loader al cambiar de ruta entre páginas protegidas.
 * Se omite la primera carga y cualquier transición desde/hacia /login, que ya
 * manejan su propio splash (entrar / cerrar sesión).
 */
function RouteTransitionLoader() {
  const location = useLocation();
  const { flash } = useLoader();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = location.pathname;

    if (prev === null || prev === location.pathname) return;
    if (prev === '/login' || location.pathname === '/login') return;

    flash({ tone: 'route', duration: 820 });
  }, [location.pathname, flash]);

  return null;
}

function App() {
  return (
    <>
      <PWAStatus />
      <ThemeTransitionOverlay />
      <RouteTransitionLoader />
      <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedShell>
            <KpisPage />
          </ProtectedShell>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedShell>
            <Dashboard />
          </ProtectedShell>
        }
      />
      <Route
        path="/pipeline"
        element={
          <ProtectedShell>
            <Pipeline />
          </ProtectedShell>
        }
      />
      <Route
        path="/vacantes"
        element={
          <ProtectedShell>
            <Vacantes />
          </ProtectedShell>
        }
      />
      <Route
        path="/bajas"
        element={
          <ProtectedShell>
            <Bajas />
          </ProtectedShell>
        }
      />
      <Route
        path="/empleados"
        element={
          <ProtectedShell>
            <Empleados />
          </ProtectedShell>
        }
      />
      <Route
        path="/transporte"
        element={
          <ProtectedShell>
            <Transporte />
          </ProtectedShell>
        }
      />
      <Route
        path="/rutas"
        element={
          <ProtectedShell>
            <Rutas />
          </ProtectedShell>
        }
      />
      <Route
        path="/reporte-diario"
        element={
          <ProtectedShell>
            <ReporteDiario />
          </ProtectedShell>
        }
      />
      <Route path="/kpis" element={<Navigate to="/" replace />} />
      {/* /settings deshabilitada: cualquier navegación cae al fallback. */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
