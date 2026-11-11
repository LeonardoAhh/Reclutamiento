import { useEffect } from "react";
import { RefreshCw as RefreshCwIconData } from "lucide";
import {
  dismissSystemVersion,
  useSystemVersion,
} from "@/hooks/useSystemVersion";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import {
  SYSTEM_UPDATE_BANNER_CONFIG,
  SYSTEM_UPDATE_BANNER_ENGLISH,
} from "@/lib/constants";
import { toast, type ToastOptions } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  applyPWAUpdate,
  checkForPWAUpdate,
} from "@/pwa";

const SYSTEM_UPDATE_NOTICE_ID = "system-update";
const RELEASE_NOTICE_ID = "system-release";

type UpdateNoticeType = "info" | "loading" | "error" | "warning";

/** Todos los estados de actualización comparten id y presentación. */
function showUpdateNotice(
  type: UpdateNoticeType,
  options: Omit<ToastOptions, "id" | "presentation">,
): void {
  toast[type]({ ...options, id: SYSTEM_UPDATE_NOTICE_ID, presentation: "system-update" });
}

export function SystemUpdateNotification() {
  const { language } = useLanguage();
  const copy = language === "en" ? SYSTEM_UPDATE_BANNER_ENGLISH : SYSTEM_UPDATE_BANNER_CONFIG;
  const { info, shouldNotify, hasRemoteUpdate } = useSystemVersion();
  const { status } = usePWAUpdate();

  useEffect(() => {
    if (hasRemoteUpdate) void checkForPWAUpdate(true);
  }, [hasRemoteUpdate, info?.version]);

  useEffect(() => {
    const retryAction = {
      label: copy.retryLabel,
      icon: RefreshCwIconData,
      onClick: () => void applyPWAUpdate(),
    };

    switch (status) {
      case "available":
        toast.dismiss(RELEASE_NOTICE_ID);
        showUpdateNotice("info", {
          title: copy.availableTitle,
          pinned: true,
          action: { ...retryAction, label: copy.actionLabel },
        });
        break;
      case "applying":
        toast.dismiss(RELEASE_NOTICE_ID);
        showUpdateNotice("loading", { title: copy.preparingLabel, pinned: true });
        break;
      case "apply-error":
        showUpdateNotice("error", { title: copy.errorHint, pinned: true, action: retryAction });
        break;
      case "registration-error":
        showUpdateNotice("warning", { title: copy.registrationErrorTitle });
        break;
      case "idle":
        toast.dismiss(SYSTEM_UPDATE_NOTICE_ID);
        break;
    }
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
