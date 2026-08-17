import { useState, useRef, type FormEvent, useId, useEffect } from "react";
import {
  ArrowRight as ArrowRightIconData,
  Eye,
  EyeOff,
  Asterisk,
} from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { MotionConfig, motion } from "framer-motion";
import "./Login.css";

export function Login() {
  const { signIn } = useAuth();
  const { version } = useSystemVersion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const usernameId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const errorId = useId();
  const capsId = useId();

  // Cargar email recordado (si existe) + auto-focus inteligente
  useEffect(() => {
    const saved = localStorage.getItem("reclutamiento_saved_email");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
      // Si ya tiene email guardado, focus directo a contraseña
      requestAnimationFrame(() => passwordRef.current?.focus());
    } else {
      requestAnimationFrame(() => emailRef.current?.focus());
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

  // Detectar Caps Lock en el campo de contraseña
  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    const u = username.trim();
    if (!u) {
      return setError("Ingresa tu correo electrónico.");
    }
    if (!password) {
      return setError("Ingresa tu contraseña.");
    }

    setSubmitting(true);
    const result = await signIn(u, password);

    if (!result.ok) {
      setSubmitting(false);
      setError(
        result.message ?? "No se pudo iniciar sesión. Revisa tus credenciales.",
      );
      return;
    }

    if (rememberMe) {
      localStorage.setItem("reclutamiento_saved_email", u);
    } else {
      localStorage.removeItem("reclutamiento_saved_email");
    }

    setSubmitting(false);
    setIsSuccess(true);
    // La redirección la maneja RedirectIfAuthed en cuanto la sesión se actualiza.
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="login" aria-label="Inicio de sesión">
        <div className="login__left">
          <motion.div
            className="login__content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="login__header">
              <div className="login__brand">
                <span className="login__brand-icon">
                  <MorphingIcon icon={Asterisk} size={32} strokeWidth={2.5} />
                </span>
                <span className="login__brand-name">Reclutamiento</span>
              </div>
              <h1 className="login__title">ViñoPlastic Qro</h1>
              <p className="login__subtitle">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <div className="login__card">
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
                    ref={emailRef}
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
                    aria-invalid={error ? "true" : undefined}
                  />
                </div>

                {/* Campo: contraseña */}
                <div className="login__field">
                  <label htmlFor={passwordId} className="login__field-label">
                    Contraseña
                  </label>
                  <div className="login__input-wrap">
                    <input
                      ref={passwordRef}
                      id={passwordId}
                      data-testid="login-password-input"
                      className="login__input login__input--padded-r"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={handlePasswordKeyEvent}
                      onKeyDown={handlePasswordKeyEvent}
                      disabled={submitting || isSuccess}
                      required
                      aria-required="true"
                      aria-describedby={
                        [error ? errorId : null, capsLock ? capsId : null]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      aria-invalid={error ? "true" : undefined}
                    />
                    <button
                      type="button"
                      data-testid="login-toggle-password-button"
                      className="login__visibility"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                      disabled={submitting || isSuccess}
                    >
                      <MorphingIcon
                        icon={showPassword ? EyeOff : Eye}
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {capsLock && (
                    <p id={capsId} className="login__caps-warning" role="alert">
                      Bloq Mayús activado
                    </p>
                  )}
                </div>

                {/* Checkbox Recuérdame */}
                <div className="login__actions-row">
                  <label htmlFor={rememberId} className="login__checkbox-label">
                    <Checkbox
                      id={rememberId}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={submitting || isSuccess}
                    />
                    <span className="login__checkbox-text">Recuérdame</span>
                  </label>
                </div>

                <AnimatedSubmitButton
                  isSubmitting={submitting}
                  isSuccess={isSuccess}
                  isError={!!error}
                  errorText={error || undefined}
                  idleText="Ingresar"
                  loadingText="Verificando..."
                  successText="¡Bienvenido!"
                  idleIcon={ArrowRightIconData}
                  className="login__submit login__submit--full"
                  data-testid="login-submit-button"
                />
              </form>
            </div>
          </motion.div>
        </div>

        <div className="login__right" aria-hidden="true">
          <motion.div
            className="login__image-wrapper"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          >
            <video
              src="/login-video-claude.mp4"
              className="login__media"
              autoPlay
              loop
              muted
              playsInline
            />
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  );
}
