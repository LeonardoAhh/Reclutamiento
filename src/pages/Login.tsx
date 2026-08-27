import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Fingerprint,
  Eye,
  EyeOff,
  LogIn,
} from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useReducedMotion } from "framer-motion";
import "./Login.css";

type LoginError = {
  field: "username" | "password" | "form";
  message: string;
};

export function Login() {
  const { signIn } = useAuth();
  const reduceMotion = useReducedMotion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const usernameId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const titleId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const capsId = useId();

  // Cargar usuario recordado (si existe) + auto-focus inteligente
  useEffect(() => {
    document.title = "Iniciar Sesión";

    const saved = localStorage.getItem("reclutamiento_saved_email");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
      // Si ya tiene usuario guardado, focus directo a contraseña
      requestAnimationFrame(() => passwordRef.current?.focus());
    } else {
      requestAnimationFrame(() => usernameRef.current?.focus());
    }
  }, []);

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
      setError({
        field: "username",
        message: "Ingresa tu usuario o correo electrónico.",
      });
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      setError({ field: "password", message: "Ingresa tu contraseña." });
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn(u, password);

      if (!result.ok) {
        setError({
          field: "form",
          message:
            result.message ??
            "No se pudo iniciar sesión. Revisa tus credenciales.",
        });
        return;
      }

      if (rememberMe) {
        localStorage.setItem("reclutamiento_saved_email", u);
      } else {
        localStorage.removeItem("reclutamiento_saved_email");
      }

      setIsSuccess(true);
      // La redirección la maneja RedirectIfAuthed en cuanto la sesión se actualiza.
    } catch {
      setError({
        field: "form",
        message: "No se pudo iniciar sesión. Inténtalo de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login" aria-labelledby={titleId}>
      <div className="login__left">
        <div className="login__content">
            <div className="login__header">
              <div className="login__brand">
                <span className="login__brand-icon" aria-hidden="true">
                  <MorphingIcon icon={Fingerprint} size="var(--icon-size-xxl)" />
                </span>
                <span className="login__brand-name">Reclutamiento</span>
              </div>
              <h1 id={titleId} className="login__title">
                ViñoPlastic Qro
              </h1>
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
                    Correo interno
                  </label>
                  <input
                    ref={usernameRef}
                    id={usernameId}
                    data-testid="login-email-input"
                    className="login__input"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="usuario o correo@empresa.com"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (
                        error?.field === "username" ||
                        error?.field === "form"
                      ) {
                        setError(null);
                      }
                    }}
                    disabled={submitting || isSuccess}
                    required
                    aria-required="true"
                    aria-describedby={
                      error?.field === "username" ? usernameErrorId : undefined
                    }
                    aria-invalid={error?.field === "username" || undefined}
                  />
                  {error?.field === "username" && (
                    <p
                      id={usernameErrorId}
                      className="form-error-text login__field-error"
                      role="alert"
                    >
                      {error.message}
                    </p>
                  )}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (
                          error?.field === "password" ||
                          error?.field === "form"
                        ) {
                          setError(null);
                        }
                      }}
                      onKeyUp={handlePasswordKeyEvent}
                      onKeyDown={handlePasswordKeyEvent}
                      onBlur={() => setCapsLock(false)}
                      disabled={submitting || isSuccess}
                      required
                      aria-required="true"
                      aria-describedby={
                        [
                          error?.field === "password"
                            ? passwordErrorId
                            : null,
                          capsLock ? capsId : null,
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      aria-invalid={error?.field === "password" || undefined}
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
                        size="var(--icon-size-sm)"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {error?.field === "password" && (
                    <p
                      id={passwordErrorId}
                      className="form-error-text login__field-error"
                      role="alert"
                    >
                      {error.message}
                    </p>
                  )}
                  {capsLock && (
                    <p id={capsId} className="login__caps-warning" role="status">
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

                {error?.field === "form" && (
                  <p
                    id={formErrorId}
                    className="form-error-text login__form-error"
                    role="alert"
                  >
                    {error.message}
                  </p>
                )}

                <AnimatedSubmitButton
                  isSubmitting={submitting}
                  isSuccess={isSuccess}
                  idleText="Ingresar"
                  loadingText="Verificando..."
                  successText="¡Bienvenido!"
                  idleIcon={LogIn}
                  className="btn-primary login__submit"
                  data-testid="login-submit-button"
                />
              </form>
            </div>
          </div>
        </div>

      {!reduceMotion && (
        <div className="login__right" aria-hidden="true">
          <div className="login__image-wrapper">
            <video
              src="/login-video-claude.mp4"
              className="login__media"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      )}
    </main>
  );
}
