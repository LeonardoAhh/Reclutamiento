import { useLoginStoryAnimation } from "./useLoginStoryAnimation";
import { BrandMark } from "@/components/ui/BrandMark";
import { LiveOrb } from "@/components/ui/LiveOrb";
import { loginTranslations, type LoginLanguage } from "../login-translations";

interface LoginStoryProps {
  username?: string | null;
  language: LoginLanguage;
}

export function LoginStory({ username, language }: LoginStoryProps) {
  const { scope, isDesktop } = useLoginStoryAnimation();
  const copy = loginTranslations[language];

  const greeting = username
    ? `${copy.greeting}, ${username[0].toUpperCase() + username.slice(1)}.`
    : `${copy.greeting}.`;

  return (
    <section className="login-story" aria-labelledby="login-story-title">
      <h2 id="login-story-title" className="sr-only">{copy.storyTitle}</h2>
      <p className="sr-only">
        {copy.storyDescription} {greeting} {copy.storyWelcome}
      </p>
      <div className="login-story__animation" ref={scope} aria-hidden="true">
        <div className="login-story__scene login-story__mark">
          <div className="login-story__visual">
            <BrandMark className="login-story__brand-image" />
          </div>
          <div className="login-story__copy">
            <p className="login-story__title">{copy.storyTitle}</p>
            <p className="login-story__description">{copy.storyDescription}</p>
          </div>
        </div>
        {isDesktop && (
          <div className="login-story__scene login-story__orb">
            <div className="login-story__visual">
              <LiveOrb size={160} />
            </div>
            <div className="login-story__copy">
              <p className="login-story__title">{greeting}</p>
              <p className="login-story__description">{copy.storyWelcome}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
