import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, PASSWORD_CHANGE_REQUIRED_EVENT } from '@/lib/supabase';
import { PasswordChangeForm } from './PasswordChangeForm';

type Check = { userId: string; status: 'loading' | 'required' | 'ready' | 'error' };

export function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? '';
  const [check, setCheck] = useState<Check>({ userId: '', status: 'loading' });
  const [signOutError, setSignOutError] = useState(false);
  const requestId = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const status = check.userId === userId ? check.status : 'loading';

  const verify = useCallback(async () => {
    if (!userId) return;
    const currentRequest = ++requestId.current;
    try {
      const { data, error } = await supabase.rpc('password_change_required');
      if (currentRequest !== requestId.current) return;
      if (error || typeof data !== 'boolean') throw new Error('Password status unavailable');
      setCheck({ userId, status: data ? 'required' : 'ready' });
    } catch {
      if (currentRequest === requestId.current) setCheck({ userId, status: 'error' });
    }
  }, [userId]);

  useEffect(() => {
    void verify();
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, verify);
    return () => {
      requestId.current += 1;
      window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, verify);
    };
  }, [verify]);

  useEffect(() => {
    if (status !== 'ready' && status !== 'error') return;
    window.addEventListener('focus', verify);
    window.addEventListener('online', verify);
    return () => {
      window.removeEventListener('focus', verify);
      window.removeEventListener('online', verify);
    };
  }, [status, verify]);

  useEffect(() => {
    if (status === 'required') headingRef.current?.focus();
  }, [status]);

  const leave = async () => {
    setSignOutError(false);
    try { await signOut(); } catch { setSignOutError(true); }
  };

  if (status === 'ready') return <>{children}</>;

  return (
    <main className="password-change-page" aria-labelledby="password-change-title">
      <section className="password-change-card">
        <header className="password-change-card__header">
          <h1 ref={headingRef} tabIndex={-1} id="password-change-title" className="type-heading-md">Actualiza tu contraseña</h1>
          {status === 'required' && <p className="type-body-sm text-muted">Reemplaza la contraseña inicial por una que solo tú conozcas.</p>}
        </header>
        {status === 'loading' && <p role="status">Verificando acceso…</p>}
        {status === 'error' && (
          <>
            <p className="form-error" role="alert">No se pudo verificar el acceso. Intenta de nuevo.</p>
            <button type="button" className="btn-primary" onClick={() => { setCheck({ userId, status: 'loading' }); void verify(); }}>Reintentar</button>
          </>
        )}
        {status === 'required' ? (
          <PasswordChangeForm onCancel={() => void leave()} onChanged={verify} submitLabel="Guardar y continuar" cancelLabel="Cerrar sesión" />
        ) : (
          <button type="button" className="btn-secondary" onClick={() => void leave()}>Cerrar sesión</button>
        )}
        {signOutError && <p role="alert" className="form-error">No se pudo cerrar sesión. Intenta de nuevo.</p>}
      </section>
    </main>
  );
}
