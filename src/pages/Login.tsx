import { useState, type FormEvent, type CSSProperties, useId, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import './Login.css';

/** Reloj de sistema aislado — re-renderiza solo, sin tocar el resto del login. */
function SystemClock() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('es-MX', { hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setClock(new Date().toLocaleTimeString('es-MX', { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return <>{clock}</>;
}

const d = (delay: number): CSSProperties => ({ '--d': `${delay}s` } as CSSProperties);

export function Login() {
  const { signIn } = useAuth();
  const { flash } = useLoader();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    if (!u) return setError('Ingresa tu correo electrónico.');
    if (!password) return setError('Ingresa tu contraseña.');

    setSubmitting(true);
    const result = await signIn(u, password);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message ?? 'No se pudo iniciar sesión. Revisa tus credenciales.');
      return;
    }

    flash({ tone: 'full', duration: 7000 });
  };

  return (
    <main className="login" role="main" data-testid="login-page">
      <div className="login__grid" aria-hidden="true" />

      <div className="login__frame">
        {/* ── Barra superior ───────────────────────────────────────── */}
        <header className="login__topbar ed-fade" style={d(0)}>
          <span className="login__sys">Reclutamiento — Sistema interno</span>
          <span className="login__ref">VP·01 / Acceso</span>
          <span className="login__status">
            <i className="login__dot" /> En línea · <SystemClock />
          </span>
        </header>
        <div className="login__topline ed-line" style={d(0.1)} />

        {/* ── Cuerpo ───────────────────────────────────────────────── */}
        <div className="login__body">
          {/* Columna editorial */}
          <section className="login__editorial">
            <span className="login__index ed-up" style={d(0.15)}>(01)</span>

            <h1 className="login__wordmark">
              <span className="login__wordmark-a ed-up" style={d(0.2)}>Viño</span>
              <span className="login__wordmark-b ed-up" style={d(0.28)}>Plastic</span>
            </h1>

            <p className="login__lede ed-up" style={d(0.4)}>
              Excelencia en inyección de plásticos de ingeniería.
            </p>

            <dl className="login__specs ed-up" style={d(0.5)}>
              <div className="login__spec">
                <dt>Materia</dt>
                <dd>Polímeros de ingeniería</dd>
              </div>
              <div className="login__spec">
                <dt>Proceso</dt>
                <dd>Inyección de precisión</dd>
              </div>
              <div className="login__spec">
                <dt>Desde</dt>
                <dd>1970 · Querétaro, MX</dd>
              </div>
            </dl>
          </section>

          {/* Columna formulario */}
          <section className="login__form-panel" aria-labelledby="login-title">
            <div className="login__form-head ed-up" style={d(0.3)}>
              <span className="login__form-eyebrow">Acceso seguro</span>
              <h2 id="login-title" className="login__title">
                Bienvenido<br />de nuevo
              </h2>
            </div>

            <form className="login__form" onSubmit={handleSubmit} noValidate>
              <div className="login__field ed-up" style={d(0.4)}>
                <label htmlFor={usernameId} className="login__label">
                  <span className="login__label-num">01</span>
                  Correo electrónico
                </label>
                <div className="login__input-wrap">
                  <input
                    id={usernameId}
                    className="login__input"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="usuario@empresa.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                    required
                    data-testid="login-email-input"
                    aria-describedby={error ? errorId : undefined}
                  />
                </div>
              </div>

              <div className="login__field ed-up" style={d(0.48)}>
                <label htmlFor={passwordId} className="login__label">
                  <span className="login__label-num">02</span>
                  Contraseña
                </label>
                <div className="login__input-wrap">
                  <input
                    id={passwordId}
                    className="login__input login__input--padded-r"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    data-testid="login-password-input"
                    aria-describedby={error ? errorId : undefined}
                  />
                  <button
                    type="button"
                    className="login__visibility"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    disabled={submitting}
                    data-testid="login-toggle-password"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="login__error"
                  role="alert"
                  aria-live="polite"
                  id={errorId}
                  data-testid="login-error"
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="login__submit ed-up"
                style={d(0.56)}
                disabled={submitting}
                aria-busy={submitting}
                data-testid="login-submit-button"
              >
                {submitting ? (
                  <>
                    <span>Verificando acceso…</span>
                    <Loader2 size={16} className="login__spinner" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* ── Pie ──────────────────────────────────────────────────── */}
        <footer className="login__footer ed-fade" style={d(0.7)}>
          <span>© {new Date().getFullYear()} ViñoPlastic</span>
          <span className="login__footer-mid">Reclutamiento y Selección de Personal</span>
          <span>Confidencial</span>
        </footer>
      </div>
    </main>
  );
}
