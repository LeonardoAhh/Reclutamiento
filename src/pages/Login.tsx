import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Login.css';

/**
 * Pantalla de login. Form minimalista usuario+password, estilo "ghost"
 * (sin bordes duros, hairline rounded-2xl), theme-aware. La navegación
 * post-login se maneja desde `<RedirectIfAuthed>` que envuelve esta ruta:
 * cuando `useAuth().session` deja de ser null, el espejo redirige al
 * dashboard automáticamente.
 */
export function Login() {
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    if (!u) {
      setError('Ingresa tu usuario.');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setSubmitting(true);
    const result = await signIn(u, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo iniciar sesión.');
      return;
    }
    // Si fue OK, `<RedirectIfAuthed>` que envuelve esta ruta se encarga
    // de redirigir cuando la session aparezca en el contexto.
  }

  return (
    <main className="login" role="main">
      <div className="login__theme-toggle">
        <ThemeToggle />
      </div>

      <section className="login__card" aria-labelledby="login-title">
        <header className="login__header">
          <p className="login__eyebrow">Sistema</p>
          <h1 id="login-title" className="login__title">
            Reclutamiento
          </h1>
          <p className="login__subtitle">Control de plantilla y candidatos</p>
        </header>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="login__field">
            <label htmlFor="login-username" className="login__label">
              Usuario
            </label>
            <input
              id="login-username"
              className="login__input"
              type="text"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="login__field">
            <label htmlFor="login-password" className="login__label">
              Contraseña
            </label>
            <div className="login__input-wrap">
              <input
                id="login-password"
                className="login__input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="button"
                className="login__visibility"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={submitting}
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login__submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="login__spinner" aria-hidden="true" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <footer className="login__footer">
          <p>
            ¿Sin acceso? Pide a tu administrador que te cree una cuenta.
          </p>
        </footer>
      </section>
    </main>
  );
}
