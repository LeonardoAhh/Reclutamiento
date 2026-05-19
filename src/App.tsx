import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AuthGuard, RedirectIfAuthed } from '@/components/auth/AuthGuard';
import { PositionsProvider } from '@/lib/positions';
import { Dashboard } from '@/pages/Dashboard';
import { Pipeline } from '@/pages/Pipeline';
import { Vacantes } from '@/pages/Vacantes';
import { Bajas } from '@/pages/Bajas';
import { Transporte } from '@/pages/Transporte';
import { KpisPage } from '@/pages/KpisPage';
import { Login } from '@/pages/Login';
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

function App() {
  return (
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
        path="/transporte"
        element={
          <ProtectedShell>
            <Transporte />
          </ProtectedShell>
        }
      />
      <Route path="/kpis" element={<Navigate to="/" replace />} />
      {/* /settings deshabilitada: cualquier navegación cae al fallback. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
