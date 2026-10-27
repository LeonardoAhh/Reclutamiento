import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import { LiveOrb } from "@/components/ui/LiveOrb";
import { loginTranslations, type LoginLanguage } from "../login-translations";

interface LoginStoryProps {
  username?: string | null;
  language: LoginLanguage;
}

export function LoginStory({ username, language }: LoginStoryProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const copy = loginTranslations[language];
  const greeting = username
    ? `${copy.greeting}, ${username[0].toUpperCase() + username.slice(1)}.`
    : `${copy.greeting}.`;

  return (
    <div className="login-story">
      {isDesktop && (
        <>
          <LiveOrb size={160} />
          <div className="login-story__copy">
            <p className="login-story__greeting">{greeting}</p>
            <p className="login-story__welcome">{copy.storyWelcome}</p>
          </div>
        </>
      )}
    </div>
  );
}
