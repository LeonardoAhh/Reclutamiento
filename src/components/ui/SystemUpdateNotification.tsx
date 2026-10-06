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
import {
  applyPWAUpdate,
  checkForPWAUpdate,
  deferPWAUpdate,
} from "@/pwa";

const SYSTEM_UPDATE_NOTICE_ID = "system-update";
const RELEASE_NOTICE_ID = "system-release";

function getReleaseDescription(version: string, message?: string): string {
  return message?.trim() ? `v${version} · ${message.trim()}` : `v${version}`;
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
    switch (status) {
      case "available":
        toast.dismiss(RELEASE_NOTICE_ID);
        toast.info({
          id: SYSTEM_UPDATE_NOTICE_ID,
          title: copy.availableTitle,
          description: copy.availableHint,
          duration: Infinity,
          pinned: true,
          actions: [
            {
              label: copy.actionLabel,
              variant: "primary",
              closeOnAction: false,
              onClick: () => void applyPWAUpdate(),
            },
            {
              label: copy.deferLabel,
              onClick: deferPWAUpdate,
            },
          ],
        });
        break;
      case "applying":
        toast.dismiss(RELEASE_NOTICE_ID);
        toastStoreUpdate("loading", {
          title: copy.preparingLabel,
        });
        break;
      case "apply-error":
        toastStoreUpdate("error", {
          title: copy.errorHint,
          actions: [
            {
              label: copy.retryLabel,
              variant: "primary",
              closeOnAction: false,
              onClick: () => void applyPWAUpdate(),
            },
            {
              label: copy.deferLabel,
              onClick: deferPWAUpdate,
            },
          ],
        });
        break;
      case "registration-error":
        toastStoreUpdate("warning", {
          title: copy.registrationErrorTitle,
          description: copy.registrationErrorHint,
        });
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
      title: copy.appliedTitle,
      description: getReleaseDescription(info.version, info.mensaje),
      duration: SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
    });

    const timer = window.setTimeout(
      dismissSystemVersion,
      SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [copy, info, shouldNotify, status]);

  return null;
}

type UpdateToastType = "loading" | "error" | "warning";

function toastStoreUpdate(
  type: UpdateToastType,
  options: Omit<Parameters<typeof toast.info>[0], "id">,
): void {
  toast[type]({
    ...options,
    id: SYSTEM_UPDATE_NOTICE_ID,
    duration: type === "warning" ? undefined : Infinity,
    pinned: type !== "warning",
  });
}
