import { useState, type FormEvent, useId } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Login.css';

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

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

    // Éxito: el splash cubre la transición login → panel y se cierra solo.
    flash({ title: 'Entrando…', hint: 'Reclutamiento', duration: 1100 });
  };

  return (
    <main className="login" role="main">
      {/* Fondo decorativo */}
      <div className="login__bg" aria-hidden="true">
        <div className="login__bg-grid" />
        <div className="login__bg-wave" />
        <div className="login__bg-gradient" />
      </div>

      {/* ThemeToggle reposicionado para armonía con el nuevo layout */}
      <motion.div
        className="login__theme-toggle"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <ThemeToggle />
      </motion.div>

      <div className="login__container">
        {/* Columna izquierda - Branding editorial */}
        <motion.div
          className="login__hero"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="login__hero-accent" />
          <motion.div className="login__brand" {...fadeUp(0.1)}>
            <span className="login__brand-icon">
              <Users size={20} strokeWidth={2} />
            </span>
            <span className="login__eyebrow">Reclutamiento</span>
          </motion.div>

          <motion.h1 className="login__hero-title" {...fadeUp(0.2)}>
            ViñoPlastic
            <br />
            <em>Querétaro</em>
          </motion.h1>

          <motion.div className="login__hero-quote" {...fadeUp(0.5)}>
            <p>Desde 1970 Excelencia en Inyección de Plásticos de Ingeniería.</p>
          </motion.div>
        </motion.div>

        {/* Columna derecha - Formulario */}
        <motion.section
          className="login__card"
          aria-labelledby="login-title"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="login__accent" aria-hidden="true" />

          <header className="login__header">
            <motion.h2 id="login-title" className="login__title" {...fadeUp(0.1)}>
              Bienvenido de nuevo
            </motion.h2>
            <motion.p className="login__subtitle" {...fadeUp(0.15)}>
              Ingresa con tus credenciales
            </motion.p>
          </header>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            {/* Campo de usuario con floating label */}
            <motion.div className="login__field" {...fadeUp(0.25)}>
              <div className="login__input-group">
                <input
                  id={usernameId}
                  className="login__input"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  required
                />
                <label htmlFor={usernameId} className="login__label">
                  Correo electrónico
                </label>
                <span className="login__input-focus" />
              </div>
            </motion.div>

            {/* Campo de contraseña con visibilidad */}
            <motion.div className="login__field" {...fadeUp(0.35)}>
              <div className="login__input-group">
                <input
                  id={passwordId}
                  className="login__input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
                <label htmlFor={passwordId} className="login__label">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="login__visibility"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span className="login__input-focus" />
              </div>
            </motion.div>

            {/* Área de error animada */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="login__error"
                  role="alert"
                  aria-live="polite"
                  id={errorId}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 'var(--spacing-sm)' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de submit con efecto gradiente */}
            <motion.button
              type="submit"
              className="login__submit"
              disabled={submitting}
              aria-busy={submitting}
              {...fadeUp(0.55)}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="login__spinner" />
                  <span>Verificando acceso…</span>
                </>
              ) : (
                <>
                  <span>Ingresar al panel</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>

            <motion.div className="login__footer-note" {...fadeUp(0.65)}>
              <CheckCircle size={14} />
              <span>Reclutamiento y Selección de Personal</span>
            </motion.div>
          </form>
        </motion.section>
      </div>
    </main>
  );
}
