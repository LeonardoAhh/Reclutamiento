import { useEffect } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import { wave } from "robot-toast/robots";
import { BrandMark } from "@/components/ui/BrandMark";
import { loginTranslations, type LoginLanguage } from "../login-translations";

interface LoginStoryProps {
  username?: string | null;
  language: LoginLanguage;
}

export function LoginStory({ username, language }: LoginStoryProps) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();
  const copy = loginTranslations[language];

  useEffect(() => {
    if (reduceMotion !== false) return;

    const duration = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--duration-brand-reveal"),
    ) / 1000;
    const fadeDuration = duration / 2;
    const playback = animate([
      [".login-story__mark", { opacity: [1, 0] }, { at: fadeDuration, duration: fadeDuration }],
      [".login-story__robot", { opacity: [0, 1], y: ["var(--design-spacing-md)", "0px"] }, { duration: fadeDuration }],
    ]);

    return () => playback.cancel();
  }, [animate, reduceMotion]);

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
        {reduceMotion === false && (
          <div className="login-story__scene login-story__robot">
            <div className="login-story__visual">
              <img className="login-story__robot-image" src={wave} alt="" />
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
