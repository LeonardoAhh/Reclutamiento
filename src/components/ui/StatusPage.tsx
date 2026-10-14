import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeading } from '@/components/layout/PageHeading';
import { HOME_PATH } from '@/components/layout/navigation';
import './StatusPage.css';

export type StatusKind = 'expired' | 'forbidden' | 'not-found' | 'server' | 'offline';

const content = {
  es: {
    expired: { code: '401', heading: 'Sesión expirada', description: 'Inicia sesión de nuevo para continuar.' },
    forbidden: { code: '403', heading: 'No tienes acceso', description: 'Tu cuenta no tiene permiso para ver esta página. Solicita acceso a un administrador si lo necesitas.' },
    'not-found': { code: '404', heading: 'Página no encontrada', description: 'Es posible que la página haya cambiado de lugar o que el enlace sea incorrecto.' },
    server: { code: '500', heading: 'Algo salió mal', description: 'No pudimos cargar esta página. Intenta de nuevo.' },
    offline: { code: 'Sin conexión', heading: 'No pudimos cargar la página', description: 'Esta página necesita conexión. Comprueba tu red e intenta de nuevo.' },
    home: 'Ir a Inicio', back: 'Volver', retry: 'Reintentar', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión',
  },
  en: {
    expired: { code: '401', heading: 'Session expired', description: 'Sign in again to continue.' },
    forbidden: { code: '403', heading: "You don't have access", description: "Your account doesn't have permission to view this page. Ask an administrator if you need access." },
    'not-found': { code: '404', heading: 'Page not found', description: 'The page may have moved or the link may be incorrect.' },
    server: { code: '500', heading: 'Something went wrong', description: "We couldn't load this page. Try again." },
    offline: { code: 'Offline', heading: "We couldn't load the page", description: 'This page needs a connection. Check your network and try again.' },
    home: 'Go to Home', back: 'Go back', retry: 'Try again', signIn: 'Sign in', signOut: 'Sign out',
  },
} as const;

interface StatusPageProps {
  kind: StatusKind;
  standalone?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  onSignOut?: () => void;
}

export function StatusPage({ kind, standalone = false, onRetry, retrying = false, onSignOut }: StatusPageProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = content[language];
  const state = t[kind];
  const title = kind === 'not-found' ? (language === 'en' ? 'Not found' : 'No encontrada') : state.heading;
  useEffect(() => {
    if (standalone) document.title = state.heading;
  }, [standalone, state.heading]);
  const body = <>
    <p className="status-page__code">{kind === 'offline' ? state.code : `ERROR ${state.code}`}</p>
    {/^[0-9]+$/.test(state.code) && <p className="status-page__number" aria-hidden="true">{state.code}</p>}
    {standalone ? <h1 className="status-page__heading">{state.heading}</h1> : <h2 className="status-page__heading">{state.heading}</h2>}
    <p className="status-page__description">{state.description}</p>
    <div className="status-page__actions">
      {kind === 'expired' ? <Link className="btn-primary" to="/login">{t.signIn}</Link>
        : kind === 'offline' || kind === 'server' ? <>
              {onRetry && <button className="btn-primary" type="button" onClick={onRetry} disabled={retrying} aria-busy={retrying}>{t.retry}</button>}
              {standalone ? onSignOut && <button className="btn-secondary" type="button" onClick={onSignOut}>{t.signOut}</button>
                : <Link className="btn-secondary" to={HOME_PATH}>{t.home}</Link>}
            </>
            : <>
                <Link className="btn-primary" to={HOME_PATH}>{t.home}</Link>
                {kind === 'not-found' && <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>{t.back}</button>}
              </>}
    </div>
  </>;

  return <main className={`status-page${standalone ? ' status-page--standalone' : ' container'}`}>
    {!standalone && <PageHeading className="app-page-title">{title}</PageHeading>}
    <section className="status-page__content" aria-label={state.heading}>{body}</section>
  </main>;
}
