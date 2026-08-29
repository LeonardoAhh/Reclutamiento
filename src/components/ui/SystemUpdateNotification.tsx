import { useEffect } from "react";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { SYSTEM_UPDATE_BANNER_CONFIG } from "@/lib/constants";
import { toast } from "@/lib/notify";

import type { SystemNotiLevel } from "@/hooks/useSystemVersion";

const SYSTEM_UPDATE_NOTICE_ID = "system-update";

const LEVEL_TOAST: Record<
  SystemNotiLevel,
  (options: Parameters<typeof toast.info>[0]) => string
> = {
  info: toast.info,
  success: toast.success,
  mantenimiento: toast.warning,
};

export function SystemUpdateNotification() {
  const { info, shouldNotify, dismiss } = useSystemVersion();

  useEffect(() => {
    if (!shouldNotify) return;

    const notify = LEVEL_TOAST[info?.nivel ?? "info"];
    notify({
      id: SYSTEM_UPDATE_NOTICE_ID,
      title: SYSTEM_UPDATE_BANNER_CONFIG.availableTitle,
      description: info?.version ? `v${info.version}` : undefined,
    });

    const timer = window.setTimeout(dismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [dismiss, info?.nivel, info?.version, shouldNotify]);

  return null;
}
