import { useEffect } from "react";
import {
  dismissSystemVersion,
  useSystemVersion,
} from "@/hooks/useSystemVersion";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { SYSTEM_UPDATE_BANNER_CONFIG } from "@/lib/constants";
import { toast } from "@/lib/notify";
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
          title: SYSTEM_UPDATE_BANNER_CONFIG.availableTitle,
          description: SYSTEM_UPDATE_BANNER_CONFIG.availableHint,
          duration: Infinity,
          actions: [
            {
              label: SYSTEM_UPDATE_BANNER_CONFIG.actionLabel,
              variant: "primary",
              closeOnAction: false,
              onClick: () => void applyPWAUpdate(),
            },
            {
              label: SYSTEM_UPDATE_BANNER_CONFIG.deferLabel,
              onClick: deferPWAUpdate,
            },
          ],
        });
        break;
      case "applying":
        toast.dismiss(RELEASE_NOTICE_ID);
        toastStoreUpdate("loading", {
          title: SYSTEM_UPDATE_BANNER_CONFIG.preparingLabel,
        });
        break;
      case "apply-error":
        toastStoreUpdate("error", {
          title: SYSTEM_UPDATE_BANNER_CONFIG.errorHint,
          actions: [
            {
              label: SYSTEM_UPDATE_BANNER_CONFIG.retryLabel,
              variant: "primary",
              closeOnAction: false,
              onClick: () => void applyPWAUpdate(),
            },
            {
              label: SYSTEM_UPDATE_BANNER_CONFIG.deferLabel,
              onClick: deferPWAUpdate,
            },
          ],
        });
        break;
      case "registration-error":
        toastStoreUpdate("warning", {
          title: SYSTEM_UPDATE_BANNER_CONFIG.registrationErrorTitle,
          description: SYSTEM_UPDATE_BANNER_CONFIG.registrationErrorHint,
        });
        break;
      case "idle":
        toast.dismiss(SYSTEM_UPDATE_NOTICE_ID);
        break;
    }
  }, [status]);

  useEffect(() => {
    if (!shouldNotify || !info || status === "available" || status === "applying") {
      return;
    }

    toast.success({
      id: RELEASE_NOTICE_ID,
      title: SYSTEM_UPDATE_BANNER_CONFIG.appliedTitle,
      description: getReleaseDescription(info.version, info.mensaje),
      duration: SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
    });

    const timer = window.setTimeout(
      dismissSystemVersion,
      SYSTEM_UPDATE_BANNER_CONFIG.noticeDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [info, shouldNotify, status]);

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
  });
}
