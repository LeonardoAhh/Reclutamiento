import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { useFeedback } from "@/hooks/useFeedback";
import { useLoader } from "@/hooks/useLoader";
import { APP_BRAND_NAME, HOME_PATH, LOGOUT_PATH } from "@/components/layout/navigation";
import { toast } from "@/lib/notify";
import { toNaturalCase } from "@/lib/utils";
import "./LogoutPage.css";

function getReturnPath(state: unknown): string {
  if (!state || typeof state !== "object" || !("returnTo" in state)) return HOME_PATH;
  const path = state.returnTo;
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return HOME_PATH;
  }
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname === LOGOUT_PATH || pathname === "/login" ? HOME_PATH : path;
}

export function LogoutPage() {
  const { profile, user, username, signOut } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const loader = useLoader();
  const { trigger } = useFeedback();
  const pendingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const displayName = toNaturalCase(profile?.display_name || username, {
    preserveAcronyms: false,
  });

  useEffect(() => {
    document.title = "Cerrar sesión";
  }, []);

  async function handleSignOut() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsLoading(true);
    trigger("light");
    loader.show({ title: "Cerrando sesión…", variant: "workspace-exit" });
    try {
      await signOut();
      trigger("success");
    } catch {
      toast.error({ title: "No se pudo cerrar sesión. Inténtalo de nuevo." });
    } finally {
      loader.hide();
      pendingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="logout-page">
      <header className="logout-page__header container">
        <span className="logout-page__brand">
          <BrandMark className="logout-page__brand-icon" />
        </span>
      </header>

      <main className="logout-page__main container">
        <div className="logout-page__content">
        <h1>
        ¿Salir de tu cuenta?
        </h1>
          <div className="logout-page__identity">
            <Avatar name={displayName} src={profile?.avatar_url} />
            <div className="logout-page__identity-copy">
              <strong>{displayName}</strong>
              {user?.email && <span>{user.email}</span>}
            </div>
          </div>
          <div className="logout-page__actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSignOut()}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(getReturnPath(state), { replace: true })}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
