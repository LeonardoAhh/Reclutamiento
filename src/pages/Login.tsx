import { useState, type FormEvent, useId, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import { useAuth } from '@/hooks/useAuth';
import { sileo } from '@/lib/notify';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import './Login.css';

// Valores hex para la API del navegador (<meta name="theme-color">).
// No pueden ser CSS variables — el browser los necesita resueltos.
// Deben coincidir con --color-canvas de global.css (Notion warm paper / dark neutral).
const BROWSER_BAR_LIGHT = '#f6f5f4';
const BROWSER_BAR_DARK  = '#191817';

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
  const [submitting, setSubmitting]   = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [shakeKey, setShakeKey]       = useState(0);

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
    setIsSuccess(false);

    const u = username.trim();
    if (!u) {
      setShakeKey(k => k + 1);
      return setError('Ingresa tu correo electrónico.');
    }
    if (!password) {
      setShakeKey(k => k + 1);
      return setError('Ingresa tu contraseña.');
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    const result = await signIn(u, password);

    if (!result.ok) {
      setSubmitting(false);
      setShakeKey(k => k + 1);
      setError(result.message ?? 'No se pudo iniciar sesión. Revisa tus credenciales.');
      sileo.error({ title: 'No se pudo iniciar sesión', description: 'Revisa tus credenciales.' });
      return;
    }

    setIsSuccess(true);
    // La redirección la maneja RedirectIfAuthed en cuanto la sesión se actualiza.
  };

  return (
    <main className="login" role="main" aria-label="Inicio de sesión">

      {/* ────────────────────────────────────────────────────────────
          Panel izquierdo — identidad de marca
          Animado: Entra con un ligero desvanecimiento y deslizamiento
      ──────────────────────────────────────────────────────────── */}
      <motion.section 
        className="login__panel" 
        aria-hidden="true"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="login__panel-grid" />

        {/* Stickers decorativos (mobile only) - Animación pop en secuencia */}
        <div className="login__stickers" aria-hidden="true">
          <motion.div 
            className="login__sticker login__sticker--pink"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
          />
          <motion.div 
            className="login__sticker login__sticker--sky"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 10 }}
          />
          <motion.div 
            className="login__sticker login__sticker--orange"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 10 }}
          />
        </div>

        <header className="login__panel-header">
          <div className="login__brand">
            <span className="login__brand-label">Reclutamiento</span>
          </div>
        </header>

        <div className="login__panel-body">
          {/* Mask Reveal (Editorial) para el título */}
          <div style={{ overflow: 'hidden', paddingBottom: '8px' }}>
            <motion.p 
              className="login__wordmark"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              ViñoPlastic
            </motion.p>
          </div>

          {/* Blur Reveal cinemático para el subtítulo */}
          <motion.blockquote 
            className="login__tagline"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <span className="login__tagline-year">Desde 1970</span>
            <p>Excelencia en Inyección de Plásticos de Ingeniería.</p>
          </motion.blockquote>
        </div>

        <footer className="login__panel-footer">
          <span className="login__panel-copy">
            © {new Date().getFullYear()} ViñoPlastic
          </span>
        </footer>
      </motion.section>

      {/* ────────────────────────────────────────────────────────────
          Panel derecho — formulario
          Animado: Tarjeta que desliza desde abajo tipo BottomSheet
      ──────────────────────────────────────────────────────────── */}
      <motion.div 
        className="login__form-panel"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 200 }}
      >
        <motion.section
          className="login__form-wrap"
          aria-labelledby="login-heading"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div animate={shakeKey > 0 ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}>
            <motion.header className="login__header" variants={staggerItem}>
              <span className="login__eyebrow">Acceso seguro</span>
              <h1 id="login-heading" className="login__title">
                Bienvenido de nuevo
              </h1>
            </motion.header>

            <form
              className="login__form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Formulario de inicio de sesión"
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
                    className="login__visibility btn-icon"
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

              {/* Error inline animado */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    id={errorId}
                    data-testid="login-error-message"
                    className="login__error"
                    role="alert"
                    aria-live="assertive"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Botón Animado */}
              <motion.div variants={staggerItem}>
                <AnimatedSubmitButton
                  isSubmitting={submitting}
                  isSuccess={isSuccess}
                  idleText="Ingresar"
                  loadingText="Verificando..."
                  successText="¡Bienvenido!"
                  idleIcon={ArrowRight}
                  className="login__submit"
                  data-testid="login-submit-button"
                  style={{ justifyContent: 'space-between' }}
                />
              </motion.div>

            </form>
          </motion.div>
        </motion.section>
      </motion.div>

    </main>
  );
}
