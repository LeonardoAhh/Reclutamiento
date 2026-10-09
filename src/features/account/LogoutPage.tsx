import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { HOME_PATH, LOGOUT_PATH } from "@/components/layout/navigation";
import { toNaturalCase } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSignOut } from "./useSignOut";
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
  const { language } = useLanguage();
  const english = language === "en";
  const { profile, user, username } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { handleSignOut, isLoading } = useSignOut();
  const displayName = toNaturalCase(profile?.display_name || username, {
    preserveAcronyms: false,
  });

  useEffect(() => {
    document.title = english ? "Sign out" : "Cerrar sesión";
  }, [english]);

  return (
    <div className="logout-page">
      <header className="logout-page__header container">
        <span className="logout-page__brand">
          <BrandMark className="logout-page__brand-icon" />
        </span>
      </header>

      <main className="logout-page__main container">
        <div className="logout-page__content">
        <h1>{english ? "Sign out of your account?" : "¿Salir de tu cuenta?"}</h1>
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
              {isLoading
                ? english
                  ? "Signing out…"
                  : "Cerrando sesión…"
                : english
                  ? "Sign out"
                  : "Cerrar sesión"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(getReturnPath(state), { replace: true })}
              disabled={isLoading}
            >
              {english ? "Cancel" : "Cancelar"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
