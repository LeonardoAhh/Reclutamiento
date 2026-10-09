import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFeedback } from "@/hooks/useFeedback";
import { useLoader } from "@/hooks/useLoader";
import { toast } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";

export function useSignOut() {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const loader = useLoader();
  const { trigger } = useFeedback();
  const pendingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const english = language === "en";

  const handleSignOut = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsLoading(true);
    trigger("light");
    loader.show({
      title: english ? "Signing out…" : "Cerrando sesión…",
      variant: "workspace-exit",
    });
    try {
      await signOut();
      trigger("success");
    } catch {
      toast.error({
        title: english
          ? "Could not sign out. Please try again."
          : "No se pudo cerrar sesión. Inténtalo de nuevo.",
      });
    } finally {
      loader.hide();
      pendingRef.current = false;
      setIsLoading(false);
    }
  }, [english, loader, signOut, trigger]);

  return { handleSignOut, isLoading };
}
