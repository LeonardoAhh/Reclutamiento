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
import { emailToUsername, usernameToEmail } from "@/lib/auth";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import "./Login.css";

type LoginError = {
  field: "username" | "password" | "form";
  message: string;
};

const SAVED_USERNAME_KEY = "reclutamiento_saved_email";

function readSavedUsername() {
  try {
    return localStorage.getItem(SAVED_USERNAME_KEY);
  } catch {
    return null;
  }
}

function persistSavedUsername(username: string | null) {
  try {
    if (username) localStorage.setItem(SAVED_USERNAME_KEY, username);
    else localStorage.removeItem(SAVED_USERNAME_KEY);
  } catch {
    // Inicio de sesión sigue disponible cuando almacenamiento está bloqueado.
  }
}

export function Login() {
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(null);
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

  useEffect(() => {
    document.title = "Iniciar sesión";

    const saved = readSavedUsername();
    if (saved) {
      const savedUsername = emailToUsername(usernameToEmail(saved));
      setUsername(savedUsername);
      setRememberedUsername(savedUsername);
      setRememberMe(true);
    }

    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return;
    const frame = requestAnimationFrame(() => {
      (saved ? passwordRef : usernameRef).current?.focus();
    });
    return () => cancelAnimationFrame(frame);
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
        message: "Ingresa tu usuario.",
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
          message: result.message === "Usuario o contraseña incorrectos."
            ? result.message
            : result.message?.startsWith("Cuenta sin confirmar.")
              ? "Cuenta sin confirmar. Pide ayuda a tu administrador."
              : "No se pudo iniciar sesión. Inténtalo de nuevo.",
        });
        return;
      }

      persistSavedUsername(rememberMe ? u : null);

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

  const returningUsername = rememberMe && rememberedUsername &&
    !rememberedUsername.includes("@") &&
    username.trim().toLowerCase() === rememberedUsername.toLowerCase()
      ? rememberedUsername[0].toUpperCase() + rememberedUsername.slice(1)
      : null;

  return (
    <main className="login">
      <div className="login__left">
        <div className="login__content">
          <div className="login__brand">
            <span className="login__brand-icon" aria-hidden="true">
              <MorphingIcon icon={Fingerprint} size="var(--icon-size-xxl)" />
            </span>
            <span className="login__brand-name">Reclutamiento · ViñoPlastic Querétaro</span>
          </div>

          <section className="login__card" aria-labelledby={titleId}>
            <header className="login__heading">
              <h1 id={titleId} className="login__title">
                Iniciar sesión
              </h1>
              <p className="login__subtitle">
                {returningUsername
                  ? `Bienvenido de nuevo, ${returningUsername}.`
                  : "Usa el usuario que se te asigno."}
              </p>
            </header>
            <form
              className="login__form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Formulario de inicio de sesión"
              aria-busy={submitting || undefined}
              aria-describedby={
                error?.field === "form" ? formErrorId : undefined
              }
            >
                <div className="login__field">
                  <label htmlFor={usernameId} className="login__field-label">
                    Usuario
                  </label>
                  <input
                    ref={usernameRef}
                    id={usernameId}
                    name="username"
                    data-testid="login-email-input"
                    className="login__input"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="Tu usuario"
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
                      name="password"
                      data-testid="login-password-input"
                      className="login__input login__input--padded-r"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      enterKeyHint="go"
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
                      name="remember_username"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={submitting || isSuccess}
                    />
                    <span className="login__checkbox-text">Recordar usuario</span>
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
                  loadingText="Verificando…"
                  successText="¡Bienvenido!"
                  idleIcon={LogIn}
                  className="btn-primary login__submit"
                  data-testid="login-submit-button"
                />
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
