import { useState, type FormEvent, useId, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sileo } from '@/lib/notify';
import './Login.css';

// Valores hex para la API del navegador (<meta name="theme-color">).
// No pueden ser CSS variables — el browser los necesita resueltos.
// Deben coincidir con --color-canvas de global.css (Notion warm paper / dark neutral).
const BROWSER_BAR_LIGHT = '#f6f5f4';
const BROWSER_BAR_DARK  = '#191817';

export function Login() {
  const { signIn } = useAuth();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const usernameId = useId();
  const passwordId = useId();
  const errorId    = useId();

  // El login siempre es modo claro. Forzamos data-theme="light" mientras
  // está montado y restauramos el tema del usuario al salir.
  useEffect(() => {
    const root = document.documentElement;
    const meta = document.getElementById('theme-color-meta');
    const prevTheme = root.getAttribute('data-theme');

    root.setAttribute('data-theme', 'light');
    root.style.backgroundColor = BROWSER_BAR_LIGHT;
    meta?.setAttribute('content', BROWSER_BAR_LIGHT);

    return () => {
      const stored = window.localStorage.getItem('reclutamiento_theme');
      const theme =
        stored === 'dark' || stored === 'light'
          ? stored
          : prevTheme === 'dark' ? 'dark' : 'light';

      root.setAttribute('data-theme', theme);
      root.style.backgroundColor = theme === 'dark' ? BROWSER_BAR_DARK : BROWSER_BAR_LIGHT;
      meta?.setAttribute('content', theme === 'dark' ? BROWSER_BAR_DARK : BROWSER_BAR_LIGHT);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    if (!u)       return setError('Ingresa tu correo electrónico.');
    if (!password) return setError('Ingresa tu contraseña.');

    setSubmitting(true);
    const result = await signIn(u, password);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message ?? 'No se pudo iniciar sesión. Revisa tus credenciales.');
      sileo.error({ title: 'No se pudo iniciar sesión', description: 'Revisa tus credenciales.' });
      return;
    }

    sileo.success({ title: 'Sesión iniciada', description: 'Bienvenido de nuevo.' });
    // La redirección la maneja RedirectIfAuthed en cuanto la sesión se actualiza.
  };

  return (
    <main className="login" role="main" aria-label="Inicio de sesión">

      {/* ────────────────────────────────────────────────────────────
          Panel izquierdo — identidad de marca
          aria-hidden: contenido decorativo, no necesario para SR
      ──────────────────────────────────────────────────────────── */}
      <section className="login__panel" aria-hidden="true">
        <div className="login__panel-grid" />

        <header className="login__panel-header">
          <div className="login__brand">
            <span className="login__brand-label">Reclutamiento</span>
          </div>
        </header>

        <div className="login__panel-body">
          <p className="login__wordmark">ViñoPlastic</p>

          <blockquote className="login__tagline">
            <span className="login__tagline-year">Desde 1970</span>
            <p>Excelencia en Inyección de Plásticos de Ingeniería.</p>
          </blockquote>
        </div>

        <footer className="login__panel-footer">
          <span className="login__panel-copy">
            © {new Date().getFullYear()} ViñoPlastic
          </span>
        </footer>
      </section>

      {/* ────────────────────────────────────────────────────────────
          Panel derecho — formulario
      ──────────────────────────────────────────────────────────── */}
      <div className="login__form-panel">
        <section
          className="login__form-wrap"
          aria-labelledby="login-heading"
        >
          <header className="login__header">
            <span className="login__eyebrow">Acceso seguro</span>
            <h1 id="login-heading" className="login__title">
              Bienvenido de nuevo
            </h1>
          </header>

          <form
            className="login__form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulario de inicio de sesión"
          >

            {/* Campo: correo */}
            <div className="login__field">
              <label htmlFor={usernameId} className="login__field-label">
                Correo electrónico
              </label>
              <input
                id={usernameId}
                data-testid="login-email-input"
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
                aria-required="true"
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? 'true' : undefined}
              />
            </div>

            {/* Campo: contraseña */}
            <div className="login__field">
              <label htmlFor={passwordId} className="login__field-label">
                Contraseña
              </label>
              <div className="login__input-wrap">
                <input
                  id={passwordId}
                  data-testid="login-password-input"
                  className="login__input login__input--padded-r"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  aria-required="true"
                  aria-describedby={error ? errorId : undefined}
                  aria-invalid={error ? 'true' : undefined}
                />
                <button
                  type="button"
                  data-testid="login-toggle-password-button"
                  className="login__visibility btn-icon"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  disabled={submitting}
                >
                  {showPassword
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye   size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Error inline */}
            {error && (
              <div
                id={errorId}
                data-testid="login-error-message"
                className="login__error"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              data-testid="login-submit-button"
              className="login__submit"
              disabled={submitting}
              aria-busy={submitting}
              aria-label={
                submitting
                  ? 'Verificando credenciales, por favor espera'
                  : 'Ingresar al sistema'
              }
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="login__spinner" aria-hidden="true" />
                  <span>Verificando credenciales...</span>
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

    </main>
  );
}
