import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Login.css';

/**
 * Pantalla de login. Form minimalista usuario+password, estilo editorial
 * con Framer Motion. La navegación post-login se maneja desde
 * `<RedirectIfAuthed>`: cuando `useAuth().session` deja de ser null,
 * el espejo redirige al dashboard automáticamente.
 */

/* Easing suave reutilizable */
const EASE = [0.22, 1, 0.36, 1] as const;

/* Animación de entrada estándar para cada elemento de la UI */
function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: EASE, delay },
  };
}

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
      setError('Ingresa tu correo.');
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
      {/* Fondo decorativo */}
      <div className="login__bg" aria-hidden="true">
        <div className="login__bg-grid" />
        <div className="login__bg-gradient" />
      </div>

      {/* ThemeToggle */}
      <motion.div
        className="login__theme-toggle"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Card principal */}
      <motion.section
        className="login__card"
        aria-labelledby="login-title"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="login__accent" aria-hidden="true" />

        {/* Header */}
        <header className="login__header">
          <motion.div className="login__brand" {...fadeUp(0.15)}>
            <span className="login__brand-icon" aria-hidden="true">
              <Users size={14} strokeWidth={2.5} />
            </span>
            <span className="login__eyebrow">Viñoplastic Querétaro</span>
          </motion.div>

          <motion.h1
            id="login-title"
            className="login__title"
            {...fadeUp(0.22)}
          >
            Reclutamiento
            <br />
            <em className="login__title-em">&amp; Selección</em>
          </motion.h1>
        </header>

        {/* Form */}
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <motion.div className="login__field" {...fadeUp(0.35)}>
            <label htmlFor="login-username" className="login__label">
              Correo electrónico
            </label>
            <input
              id="login-username"
              className="login__input"
              type="text"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="usuario@reclutamiento.local"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              required
            />
          </motion.div>

          <motion.div className="login__field" {...fadeUp(0.42)}>
            <label htmlFor="login-password" className="login__label">
              Contraseña
            </label>
            <div className="login__input-wrap">
              <input
                id="login-password"
                className="login__input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="button"
                className="login__visibility"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={submitting}
              >
                {showPassword ? (
                  <EyeOff size={15} aria-hidden="true" />
                ) : (
                  <Eye size={15} aria-hidden="true" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Error — expand/collapse animado */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                className="login__error"
                role="alert"
                key="login-error"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 'var(--spacing-xs)' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="login__submit"
            disabled={submitting}
            aria-busy={submitting}
            {...fadeUp(0.49)}
            whileHover={!submitting ? { scale: 1.015 } : {}}
            whileTap={!submitting ? { scale: 0.985 } : {}}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="login__spinner" aria-hidden="true" />
                Verificando…
              </>
            ) : (
              <>
                Ingresar
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </motion.button>
        </form>
      </motion.section>
    </main>
  );
}
