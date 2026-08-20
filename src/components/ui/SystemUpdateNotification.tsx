import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info as InfoData, CheckCircle2 as CheckCircle2Data, Wrench as WrenchData } from "lucide";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { SYSTEM_UPDATE_BANNER_CONFIG } from "@/lib/constants";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import "./SystemUpdateNotification.css";

import type { SystemNotiLevel } from "@/hooks/useSystemVersion";
import type { IconInput } from "morphicons/react";

const LEVEL_ICON: Record<SystemNotiLevel, IconInput> = {
  info: InfoData,
  success: CheckCircle2Data,
  mantenimiento: WrenchData,
};

export function SystemUpdateNotification() {
  const { info, shouldNotify, dismiss } = useSystemVersion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldNotify) {
      setVisible(true);
      // Auto-dismiss after 4 seconds as per design.md toast behavior
      const timer = setTimeout(() => {
        setVisible(false);
        // Esperamos a que termine la animación de salida antes de hacer dismiss real
        setTimeout(() => {
          dismiss();
        }, 500);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldNotify, dismiss]);

  const level = info?.nivel ?? "info";
  const Icon = LEVEL_ICON[level];

  return (
    <AnimatePresence>
      {visible && (
        <div className="system-update-toast-container">
          <motion.div
            className={`system-update-toast system-update-toast--${level}`}
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            role="status"
            aria-live="polite"
          >
            <div className="system-update-toast__icon">
              <MorphingIcon icon={Icon} />
            </div>
            <div className="system-update-toast__content">
              <strong className="system-update-toast__title">
                {SYSTEM_UPDATE_BANNER_CONFIG.availableTitle}
              </strong>
              {info?.version && (
                <span className="system-update-toast__tag">v{info.version}</span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
