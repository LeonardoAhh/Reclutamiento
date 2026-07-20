import { useState, type FormEvent, useId, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, AlertCircle, ChevronRight } from 'lucide-react';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/hooks/useAuth';
import { sileo } from '@/lib/notify';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion';
import './Login.css';

// Framer Motion Variants
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Login() {
  const { signIn } = useAuth();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [showForm, setShowForm]       = useState(false);

  const usernameId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const errorId    = useId();

  // Cargar email recordado (si existe)
  useEffect(() => {
    const saved = localStorage.getItem('reclutamiento_saved_email');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  // Limpiar error después de 3 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Limpiar error si el usuario empieza a escribir de nuevo
  useEffect(() => {
    if (error) setError(null);
  }, [username, password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    const u = username.trim();
    if (!u) {
      return setError('Ingresa tu correo electrónico.');
    }
    if (!password) {
      return setError('Ingresa tu contraseña.');
    }

    setSubmitting(true);
    const result = await signIn(u, password);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message ?? 'No se pudo iniciar sesión. Revisa tus credenciales.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('reclutamiento_saved_email', u);
    } else {
      localStorage.removeItem('reclutamiento_saved_email');
    }

    setSubmitting(false);
    setIsSuccess(true);
    // La redirección la maneja RedirectIfAuthed en cuanto la sesión se actualiza.
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="login" aria-label="Inicio de sesión">

      <motion.section 
        className="login__brand-panel" 
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="login__brand-content">
          <div className="login__brand-mark">
            <div className="login__brand-circle" />
          </div>
          <div className="login__brand-heading">
            <h2 className="login__brand-title">
              VIÑOPLASTIC<br />PLANTA QUERÉTARO
            </h2>
            <p className="login__brand-eyebrow">Reclutamiento</p>
          </div>
        </div>
      </motion.section>

      <section className="login__action-panel">
        <div className="login__action-content">
          <header className="login__header">
            <h1 id="login-heading" className="login__title">
              ¡Bienvenido de vuelta!
            </h1>
          </header>

          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div
                key="welcome-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="login__actions-initial"
              >
                <div className="login__divider">
                  <span>CONTINUAR CON CORREO</span>
                </div>
                
                <button 
                  className="login__btn-reveal"
                  onClick={() => setShowForm(true)}
                >
                  Ingresar con correo <ChevronRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.form
                  className="login__form"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Formulario de inicio de sesión"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {/* Campo: correo */}
                  <motion.div className="login__field" variants={staggerItem}>
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
                      disabled={submitting || isSuccess}
                      required
                      aria-required="true"
                      aria-describedby={error ? errorId : undefined}
                      aria-invalid={error ? 'true' : undefined}
                    />
                  </motion.div>

                  {/* Campo: contraseña */}
                  <motion.div className="login__field" variants={staggerItem}>
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
                        disabled={submitting || isSuccess}
                        required
                        aria-required="true"
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={error ? 'true' : undefined}
                      />
                      <button
                        type="button"
                        data-testid="login-toggle-password-button"
                        className="login__visibility"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={showPassword}
                        disabled={submitting || isSuccess}
                      >
                        {showPassword
                          ? <EyeOff size={16} aria-hidden="true" />
                          : <Eye   size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error inline animado eliminado, ahora se maneja en el botón */}

                  {/* Acciones Finales: Recuérdame + Botón */}
                  <motion.div className="login__actions-row" variants={staggerItem}>
                    <label htmlFor={rememberId} className="login__checkbox-label">
                      <Checkbox
                        id={rememberId}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={submitting || isSuccess}
                      />
                      <span className="login__checkbox-text">Recuérdame</span>
                    </label>

                    <AnimatedSubmitButton
                      isSubmitting={submitting}
                      isSuccess={isSuccess}
                      isError={!!error}
                      errorText={error || undefined}
                      idleText="Ingresar"
                      loadingText="Verificando..."
                      successText="¡Bienvenido!"
                      idleIcon={ArrowRight}
                      className="login__submit"
                      data-testid="login-submit-button"
                    />
                  </motion.div>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      </main>
    </MotionConfig>
  );
}
