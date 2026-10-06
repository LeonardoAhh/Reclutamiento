import { ThemeSelect } from "@/components/ui/ThemeSelect";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
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

  return (
    <div className="login__preferences">
      <ThemeSelect language={language} />
      <span className="login__preferences-separator" aria-hidden="true">|</span>
      <LanguageToggle className="login__language-toggle" />
      {storageError && (
        <p className="login__language-notice" role="status">
          {copy.languageStorageError}
        </p>
      )}
    </div>
  );
}
