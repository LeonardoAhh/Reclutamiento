import { success, think, wave } from "robot-toast/robots";
import { useLoginStoryAnimation } from "./useLoginStoryAnimation";
import { BrandMark } from "@/components/ui/BrandMark";
import { loginTranslations, type LoginLanguage } from "../login-translations";

interface LoginStoryProps {
  username?: string | null;
  language: LoginLanguage;
}

export function LoginStory({ username, language }: LoginStoryProps) {
  const { scope, enabled } = useLoginStoryAnimation();
  const copy = loginTranslations[language];

  const greeting = username
    ? `${copy.greeting}, ${username[0].toUpperCase() + username.slice(1)}.`
    : copy.storyGreeting;

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
        {enabled && (
          <div className="login-story__scene login-story__robot">
            <div className="login-story__visual">
              <div className="login-story__robot-motion">
                <img className="login-story__robot-image" data-expression="wave" src={wave} alt="" />
                <img className="login-story__robot-image" data-expression="think" src={think} alt="" />
                <img className="login-story__robot-image" data-expression="success" src={success} alt="" />
              </div>
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
