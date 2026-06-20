import { useState, type FormEvent, useId, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { CoreGraphic } from '@/components/ui/LoaderOverlay';
import { sileo } from '@/lib/notify';
import './Login.css';

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

export function Login() {
  const { signIn } = useAuth();
  const { flash } = useLoader();
  const reduce = useReducedMotion() ?? false;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  // La parte superior del login es negra (inmune al tema): forzamos el
  // theme-color de la barra de estado a negro mientras estamos en el login,
  // y lo restauramos al valor del tema al salir.
  useEffect(() => {
    const LOGIN_BAR = '#0d0d0f';
    const root = document.documentElement;
    const meta = document.getElementById('theme-color-meta');
    meta?.setAttribute('content', LOGIN_BAR);
    root.style.backgroundColor = LOGIN_BAR;
    return () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const restore = isDark ? '#0a0a0a' : '#ffffff';
      meta?.setAttribute('content', restore);
      root.style.backgroundColor = restore;
    };
  }, []);

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
      sileo.error({
        title: 'No se pudo iniciar sesión',
        description: result.message ?? 'Revisa tus credenciales.',
      });
      return;
    }

    sileo.success({ title: 'Sesión iniciada', description: 'Bienvenido de nuevo.' });
    flash({ tone: 'full', duration: 4000 });
  };

  return (
    <main className="login" role="main">

      {/* ── Panel izquierdo ───────────────────────────────────────────── */}
      <div className="login__panel" aria-hidden="true">
        <div className="login__panel-grid" />

        {/* TOP — brand pill, anclado arriba (oculto en mobile) */}
        <motion.div
          className="login__panel-top"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        >
          <div className="login__brand">
            <span className="login__eyebrow">Reclutamiento</span>
          </div>
        </motion.div>

        {/* CENTRO — núcleo animado (cohesivo con entrada/salida) */}
        <div className="login__visual-core">
          <CoreGraphic mode="in" reduce={reduce} />
        </div>

        {/* BOTTOM — wordmark + tagline + regla, anclados abajo */}
        <motion.div
          className="login__panel-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <motion.div className="login__wordmark" {...fadeUp(0.2)}>
            <span className="login__wordmark-main">ViñoPlastic</span>
          </motion.div>

          <motion.blockquote className="login__tagline" {...fadeUp(0.35)}>
            <span className="login__tagline-year">Desde 1970</span>
            <p>Excelencia en Inyección de Plásticos de Ingeniería.</p>
          </motion.blockquote>

          <motion.div
            className="login__panel-rule"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          />
        </motion.div>
      </div>

      {/* ── Panel derecho — sin cambios ───────────────────────────────── */}
      <div className="login__form-panel">

        <motion.section
          className="login__form-wrap"
          aria-labelledby="login-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        >
          <header className="login__header">
            <motion.h2 id="login-title" className="login__title" {...fadeUp(0.25)}>
              Bienvenido de nuevo
            </motion.h2>
          </header>

          <motion.div
            className="login__sep"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
          />

          <form className="login__form" onSubmit={handleSubmit} noValidate>

            <motion.div className="login__field" {...fadeUp(0.35)}>
              <label htmlFor={usernameId} className="login__field-label">
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
                  aria-describedby={error ? errorId : undefined}
                />
              </div>
            </motion.div>

            <motion.div className="login__field" {...fadeUp(0.42)}>
              <label htmlFor={passwordId} className="login__field-label">
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
                  aria-describedby={error ? errorId : undefined}
                />
                <button
                  type="button"
                  className="login__visibility btn-icon"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={submitting}
                  tabIndex={0}
                >
                  {showPassword
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="login__error"
                  role="alert"
                  aria-live="polite"
                  id={errorId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="login__submit"
              disabled={submitting}
              aria-busy={submitting}
              {...fadeUp(0.52)}
              whileHover={!submitting ? { x: 3 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
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
            </motion.button>

          </form>
        </motion.section>
      </div>

    </main>
  );
}
