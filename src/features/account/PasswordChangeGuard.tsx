import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, PASSWORD_CHANGE_REQUIRED_EVENT } from '@/lib/supabase';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useOfflineAccess } from '@/features/data-update/offline/hooks';
import { setOfflineAccount } from '@/features/data-update/offline/storage';

type Check = { userId: string; status: 'loading' | 'required' | 'ready' | 'error' };

export function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? '';
  const offline = useOfflineAccess(userId);
  const [check, setCheck] = useState<Check>({ userId: '', status: 'loading' });
  const [signOutError, setSignOutError] = useState(false);
  const requestId = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const status = check.userId === userId ? check.status : 'loading';
  const offlineUnavailable = !navigator.onLine && !offline.account;

  const verify = useCallback(async () => {
    if (!userId || !navigator.onLine) return;
    const currentRequest = ++requestId.current;
    try {
      const { data, error } = await supabase.rpc('password_change_required');
      if (currentRequest !== requestId.current) return;
      if (error || typeof data !== 'boolean') throw new Error('Password status unavailable');
      if (data) await setOfflineAccount(null);
      setCheck({ userId, status: data ? 'required' : 'ready' });
    } catch {
      if (currentRequest === requestId.current) setCheck({ userId, status: 'error' });
    }
  }, [userId]);

  useEffect(() => {
    void verify();
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, verify);
    window.addEventListener('online', verify);
    return () => {
      requestId.current += 1;
      window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, verify);
      window.removeEventListener('online', verify);
    };
  }, [verify]);

  useEffect(() => {
    if (status !== 'ready' && status !== 'error') return;
    window.addEventListener('focus', verify);
    return () => {
      window.removeEventListener('focus', verify);
    };
  }, [status, verify]);

  useEffect(() => {
    if (status === 'required') headingRef.current?.focus();
  }, [status]);

  const markReady = useCallback(() => {
    // El cambio exitoso ya fue confirmado por la función de servidor.
    // Invalida verificaciones anteriores para que una respuesta obsoleta
    // no vuelva a mostrar temporalmente el formulario obligatorio.
    requestId.current += 1;
    setCheck({ userId, status: 'ready' });
  }, [userId]);

  const leave = async () => {
    setSignOutError(false);
    try { await signOut(); } catch { setSignOutError(true); }
  };

  if (offline.account || status === 'ready') return <>{children}</>;

  const title = offlineUnavailable
    ? 'Dispositivo no preparado'
    : status === 'required'
    ? 'Actualiza tu contraseña'
    : status === 'error'
      ? 'Acceso no verificado'
      : 'Verificando acceso';

  return (
    <main
      className="password-change-page"
      aria-labelledby="password-change-title"
      aria-busy={(status === 'loading' && !offlineUnavailable) || undefined}
    >
      <section className="password-change-card">
        <header className="password-change-card__header">
          <h1 ref={headingRef} tabIndex={-1} id="password-change-title" className="type-heading-md">{title}</h1>
          {status === 'required' && <p className="type-body-sm text-muted">Reemplaza la contraseña inicial por una que solo tú conozcas.</p>}
        </header>
        {status === 'loading' && !offlineUnavailable && <p role="status">Comprobando la seguridad de tu cuenta…</p>}
        {(status === 'error' || offlineUnavailable) && (
          <>
            <p className="form-error" role="alert">
              {offlineUnavailable
                ? 'Conecta este dispositivo y abre Actualización de datos una vez para prepararlo.'
                : 'No se pudo verificar el acceso. Intenta de nuevo.'}
            </p>
            {!offlineUnavailable && <button type="button" className="btn-primary" onClick={() => { setCheck({ userId, status: 'loading' }); void verify(); }}>Reintentar</button>}
          </>
        )}
        {status === 'required' ? (
          <PasswordChangeForm onCancel={() => void leave()} onChanged={markReady} submitLabel="Guardar y continuar" cancelLabel="Cerrar sesión" />
        ) : (
          <button type="button" className="btn-secondary" onClick={() => void leave()}>Cerrar sesión</button>
        )}
        {signOutError && <p role="alert" className="form-error">No se pudo cerrar sesión. Intenta de nuevo.</p>}
      </section>
    </main>
  );
}
