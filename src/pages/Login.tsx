import { useEffect, useRef, useState } from "react";
import { DotGrid } from "@/components/ui/DotGrid";
import { bindSoundInteractions } from "@/lib/sound";
import { LoginForm } from "./LoginForm";
import { LoginPreferences } from "./LoginPreferences";
import { useLoginLanguage } from "./login-language";
import { loginTranslations } from "./login-translations";
import { LoginCredit } from "./login-components/LoginCredit";
import { LoginStory } from "./login-components/LoginStory";
import "./Login.css";

export function Login() {
  const { language, storageError } = useLoginLanguage();
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const copy = loginTranslations[language];

  useEffect(() => {
    document.title = copy.pageTitle;
  }, [copy.pageTitle, language]);

  useEffect(() => {
    if (mainRef.current) return bindSoundInteractions(mainRef.current);
  }, []);

  return (
    <main ref={mainRef} className="login">
      <DotGrid />
      <LoginPreferences
        language={language}
        storageError={storageError}
      />
      <div className="login__form-panel">
        <div className="login__content">
          <LoginForm
            language={language}
            onRememberedUsernameChange={setRememberedUsername}
          />
          <footer className="login__footer" aria-label={copy.legalNoticeLabel}>
            <p className="login__footer-text">{copy.legalNotice}</p>
            <LoginCredit />
          </footer>
        </div>
      </div>
      <LoginStory username={rememberedUsername} language={language} />
    </main>
  );
}
