import type { LoginLanguage } from "./login-translations";
import { loginTranslations } from "./login-translations";

interface LoginPreferencesProps {
  language: LoginLanguage;
  storageError: boolean;
}

export function LoginPreferences({
  language,
  storageError,
}: LoginPreferencesProps) {
  const copy = loginTranslations[language];
  if (!storageError) return null;

  return (
    <div className="login__preferences">
      <p className="login__language-notice" role="status">
        {copy.languageStorageError}
      </p>
    </div>
  );
}
