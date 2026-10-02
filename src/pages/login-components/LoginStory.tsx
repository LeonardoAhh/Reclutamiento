import { useEffect } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import { wave } from "robot-toast/robots";
import { BrandMark } from "@/components/ui/BrandMark";

interface LoginStoryProps {
  username?: string | null;
}

export function LoginStory({ username }: LoginStoryProps) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion !== false) return;

    const duration = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--duration-brand-reveal"),
    ) / 1000;
    const fadeDuration = duration / 2;
    const playback = animate([
      [".login-story__mark", { opacity: [1, 0] }, { duration: fadeDuration }],
      [".login-story__robot", { opacity: [0, 1], y: ["var(--design-spacing-md)", "0px"] }, { duration: fadeDuration }],
    ]);

    return () => playback.cancel();
  }, [animate, reduceMotion]);

  const greeting = username
    ? `Hola, ${username[0].toUpperCase() + username.slice(1)}.`
    : "Hola, soy Wave.";

  return (
    <section className="login-story" aria-labelledby="login-story-title">
      <h2 id="login-story-title" className="sr-only">Tu espacio de trabajo.</h2>
      <p className="sr-only">
        Retoma los pendientes de reclutamiento y personal.
        {greeting} Qué gusto verte de nuevo por aquí.
      </p>
      <div className="login-story__animation" ref={scope} aria-hidden="true">
        <div className="login-story__scene login-story__mark">
          <div className="login-story__visual">
            <BrandMark className="login-story__brand-image" />
          </div>
          <div className="login-story__copy">
            <p className="login-story__title">Tu espacio de trabajo.</p>
            <p className="login-story__description">Retoma los pendientes de reclutamiento y personal.</p>
          </div>
        </div>
        {reduceMotion === false && (
          <div className="login-story__scene login-story__robot">
            <div className="login-story__visual">
              <img className="login-story__robot-image" src={wave} alt="" />
            </div>
            <div className="login-story__copy">
              <p className="login-story__title">{greeting}</p>
              <p className="login-story__description">Qué gusto verte de nuevo por aquí.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
