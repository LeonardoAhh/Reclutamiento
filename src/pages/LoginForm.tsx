import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff, LogIn } from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { useAuth } from "@/hooks/useAuth";
import { emailToUsername, usernameToEmail } from "@/lib/auth";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import { loginTranslations, type LoginLanguage, type LoginMessageKey } from "./login-translations";

interface LoginFormProps {
  language: LoginLanguage;
  onRememberedUsernameChange: (username: string | null) => void;
}

type LoginError =
  | { field: "username"; message: "usernameRequired" }
  | { field: "password"; message: "passwordRequired" }
  | {
      field: "form";
      message: Exclude<LoginMessageKey, "usernameRequired" | "passwordRequired">;
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

export function LoginForm({
  language,
  onRememberedUsernameChange,
}: LoginFormProps) {
  const { signIn } = useAuth();
  const copy = loginTranslations[language];
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

  useEffect(() => {
    const saved = readSavedUsername();
    if (saved) {
      const savedUsername = emailToUsername(usernameToEmail(saved));
      setUsername(savedUsername);
      onRememberedUsernameChange(savedUsername);
      setRememberMe(true);
    }

    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return;
    const frame = requestAnimationFrame(() => {
      (saved ? passwordRef : usernameRef).current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [onRememberedUsernameChange]);

  const handlePasswordKeyEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError({ field: "username", message: "usernameRequired" });
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      setError({ field: "password", message: "passwordRequired" });
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn(trimmedUsername, password);
      if (!result.ok) {
        setError({
          field: "form",
          message: result.message === "Usuario o contraseña incorrectos."
            ? "invalidCredentials"
            : result.message?.startsWith("Cuenta sin confirmar.")
              ? "unconfirmedAccount"
              : "genericError",
        });
        return;
      }

      persistSavedUsername(rememberMe ? trimmedUsername : null);
      setIsSuccess(true);
    } catch {
      setError({ field: "form", message: "genericError" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login__card" aria-labelledby={titleId}>
      <header className="login__heading">
        <h1 id={titleId} className="login__title">{copy.pageTitle}</h1>
      </header>
      <form
        className="login__form"
        onSubmit={handleSubmit}
        noValidate
        aria-label={copy.formLabel}
        aria-busy={submitting || undefined}
        aria-describedby={error?.field === "form" ? formErrorId : undefined}
      >
        <div className="login__field">
          <label htmlFor={usernameId} className="login__field-label">
            {copy.username}
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
            placeholder={copy.usernamePlaceholder}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error?.field === "username" || error?.field === "form") {
                setError(null);
              }
            }}
            disabled={submitting || isSuccess}
            required
            aria-required="true"
            aria-describedby={error?.field === "username" ? usernameErrorId : undefined}
            aria-invalid={error?.field === "username" || undefined}
          />
          {error?.field === "username" && (
            <p id={usernameErrorId} className="form-error-text login__field-error" role="alert">
              {copy[error.message]}
            </p>
          )}
        </div>

        <div className="login__field">
          <label htmlFor={passwordId} className="login__field-label">
            {copy.password}
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
              onChange={(event) => {
                setPassword(event.target.value);
                if (error?.field === "password" || error?.field === "form") {
                  setError(null);
                }
              }}
              onKeyUp={handlePasswordKeyEvent}
              onKeyDown={handlePasswordKeyEvent}
              onBlur={() => setCapsLock(false)}
              disabled={submitting || isSuccess}
              required
              aria-required="true"
              aria-describedby={[
                error?.field === "password" ? passwordErrorId : null,
                capsLock ? capsId : null,
              ].filter(Boolean).join(" ") || undefined}
              aria-invalid={error?.field === "password" || undefined}
            />
            <button
              type="button"
              data-testid="login-toggle-password-button"
              className="login__visibility"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
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
            <p id={passwordErrorId} className="form-error-text login__field-error" role="alert">
              {copy[error.message]}
            </p>
          )}
          {capsLock && (
            <p id={capsId} className="login__caps-warning" role="status">
              {copy.capsLock}
            </p>
          )}
        </div>

        <div className="login__actions-row">
          <label htmlFor={rememberId} className="login__checkbox-label">
            <Checkbox
              id={rememberId}
              name="remember_username"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={submitting || isSuccess}
            />
            <span className="login__checkbox-text">{copy.rememberUsername}</span>
          </label>
        </div>

        {error?.field === "form" && (
          <p id={formErrorId} className="form-error-text login__form-error" role="alert">
            {copy[error.message]}
          </p>
        )}

        <AnimatedSubmitButton
          isSubmitting={submitting}
          isSuccess={isSuccess}
          idleText={copy.submit}
          loadingText={copy.loading}
          successText={copy.success}
          idleIcon={LogIn}
          className="btn-primary login__submit"
          data-testid="login-submit-button"
        />
      </form>
    </section>
  );
}
