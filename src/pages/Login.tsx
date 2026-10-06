import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoginForm } from "./LoginForm";
import { LoginPreferences } from "./LoginPreferences";
import { useLoginLanguage } from "./login-language";
import { loginTranslations } from "./login-translations";
import { LoginStory } from "./login-components/LoginStory";
import "./Login.css";

export function Login() {
  const { language, storageError } = useLoginLanguage();
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(null);
  const copy = loginTranslations[language];

  useEffect(() => {
    document.title = copy.pageTitle;
  }, [copy.pageTitle, language]);

  return (
    <main className="login">
      <LoginPreferences
        language={language}
        storageError={storageError}
      />
      <div className="login__form-panel">
        <div className="login__content">
          <div className="login__brand">
            <BrandMark className="login__brand-icon" />
            <span className="login__brand-name">ViñoPlastic</span>
          </div>
          <LoginForm
            language={language}
            onRememberedUsernameChange={setRememberedUsername}
          />
          <footer className="login__footer" aria-label={copy.legalNoticeLabel}>
            <p className="login__footer-text">{copy.legalNotice}</p>
          </footer>
        </div>
      </div>
      <LoginStory username={rememberedUsername} language={language} />
    </main>
  );
}
