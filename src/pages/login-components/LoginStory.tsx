import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import { LiveOrb } from "@/components/ui/LiveOrb";

export function LoginStory() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  return (
    <div className="login-story">
      {isDesktop && <LiveOrb size={160} />}
    </div>
  );
}
