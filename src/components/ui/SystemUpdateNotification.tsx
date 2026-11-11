import { useEffect } from "react";
import {
  dismissSystemVersion,
  useSystemVersion,
} from "@/hooks/useSystemVersion";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import {
  SYSTEM_UPDATE_BANNER_CONFIG,
  SYSTEM_UPDATE_BANNER_ENGLISH,
} from "@/lib/constants";
import { toast } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";

const RELEASE_NOTICE_ID = "system-release";
const REGISTRATION_NOTICE_ID = "system-registration";

/**
 * Avisos transitorios del ciclo de versión. La actualización accionable vive en
 * el control del riel; aquí solo quedan la confirmación posterior y el fallo de
 * registro del service worker, que no ofrecen acción al usuario.
 */
export function SystemUpdateNotification() {
  const { language } = useLanguage();
  const copy = language === "en" ? SYSTEM_UPDATE_BANNER_ENGLISH : SYSTEM_UPDATE_BANNER_CONFIG;
  const { info, shouldNotify } = useSystemVersion();
  const { status } = usePWAUpdate();

  useEffect(() => {
    if (status !== "registration-error") return;

    toast.warning({
      id: REGISTRATION_NOTICE_ID,
      title: copy.registrationErrorTitle,
      presentation: "system-update",
    });
  }, [copy, status]);

  useEffect(() => {
    if (!shouldNotify || !info || status === "available" || status === "applying") {
      return;
    }

    toast.success({
      id: RELEASE_NOTICE_ID,
      title: `${copy.appliedTitle} · v${info.version}`,
      duration: SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
      presentation: "system-update",
    });

    const timer = window.setTimeout(
      dismissSystemVersion,
      SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [copy, info, shouldNotify, status]);

  return null;
}
