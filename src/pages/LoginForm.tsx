import { useId } from "react";
import { Eye, EyeOff, LogIn } from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { loginTranslations, type LoginLanguage } from "./login-translations";
import { useLoginForm } from "./useLoginForm";

interface LoginFormProps {
  language: LoginLanguage;
  onRememberedUsernameChange: (username: string | null) => void;
}

export function LoginForm({
  language,
  onRememberedUsernameChange,
}: LoginFormProps) {
  const copy = loginTranslations[language];
  const {
    username, setUsername, password, setPassword,
    showPassword, setShowPassword, rememberMe, setRememberMe,
    submitting, isSuccess, error, setError, capsLock, setCapsLock,
    usernameRef, passwordRef, handlePasswordKeyEvent, handleSubmit,
    onSuccessAnimationComplete,
  } = useLoginForm(onRememberedUsernameChange);
  const usernameId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const titleId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const capsId = useId();

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
            data-cuelume-type=""
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
              data-cuelume-toggle=""
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
              data-cuelume-toggle=""
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
          feedbackSound={false}
          idleText={copy.submit}
          loadingText={copy.loading}
          successText={copy.success}
          onSuccessAnimationComplete={onSuccessAnimationComplete}
          idleIcon={LogIn}
          className="btn-primary login__submit"
          data-testid="login-submit-button"
        />
      </form>
    </section>
  );
}
