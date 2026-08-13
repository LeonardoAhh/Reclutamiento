import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Info as InfoData,
  CheckCircle2 as CheckCircle2Data,
  Wrench as WrenchData,
  X as XData,
  Download as DownloadIconData,
  LoaderCircle as LoaderCircleData,
  RefreshCw as RefreshCwIconData,
} from "lucide";
import { SYSTEM_UPDATE_BANNER_CONFIG } from "@/lib/constants";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import type { SystemNotiLevel } from "@/hooks/useSystemVersion";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import "./SystemUpdateBanner.css";

import type { IconInput } from "morphicons/react";

const LEVEL_ICON: Record<SystemNotiLevel, IconInput> = {
  info: InfoData,
  success: CheckCircle2Data,
  mantenimiento: WrenchData,
};

/**
 * Aviso global de actualización del sistema, alimentado por `version.json`.
 * - Se anuncia al detectar una versión nueva o un Service Worker listo.
 * - Los avisos opcionales se pueden posponer; mantenimiento exige actualización.
 * - Mobile-first: tarjeta superior centrada en móvil y alineada a la derecha
 *   en pantallas grandes para no interferir con el chatbot.
 */
export function SystemUpdateBanner() {
  const { info, shouldNotify, dismiss, swUpdateFn } = useSystemVersion();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const visible = shouldNotify && isOnline;
  const level = info?.nivel ?? "info";
  const Icon = LEVEL_ICON[level];
  const requiresReload = level === "mantenimiento";

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const reloadTimerRef = useRef<number | null>(null);

  const handleReload = () => {
    if (isUpdating) return;
    setUpdateFailed(false);
    setIsUpdating(true);
    reloadTimerRef.current = window.setTimeout(async () => {
      try {
        if (swUpdateFn) {
          await swUpdateFn();
          dismiss();
          return;
        }

        const registration = await navigator.serviceWorker?.getRegistration();
        await registration?.update();
        dismiss();
        window.location.reload();
      } catch (error) {
        console.error("System update failed:", error);
        setIsUpdating(false);
        setUpdateFailed(true);
      }
    }, SYSTEM_UPDATE_BANNER_CONFIG.reloadDelayMs);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (visible && requiresReload && !isUpdating) {
      actionRef.current?.focus();
    }
  }, [visible, requiresReload, isUpdating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible && !requiresReload) dismiss();
      if (e.key === "Tab" && visible && requiresReload) {
        e.preventDefault();
        actionRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, requiresReload, dismiss]);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && !isUpdating && (
        <div
          className={`system-update-overlay ${requiresReload ? "system-update-overlay--blocking" : ""}`}
        >
          <motion.section
            key={info?.version ?? "service-worker-update"}
            className={`system-update system-update--${level}`}
            role={requiresReload ? "alertdialog" : "status"}
            aria-modal={requiresReload ? true : undefined}
            aria-labelledby="system-update-title"
            aria-describedby="system-update-message"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            data-testid="system-update-banner"
          >
            <span className="system-update__badge" aria-hidden="true">
              <MorphingIcon icon={Icon} />
            </span>

            <div className="system-update__body">
              <div className="system-update__heading">
                <strong id="system-update-title" className="system-update__title">
                  {SYSTEM_UPDATE_BANNER_CONFIG.availableTitle}
                </strong>
                <span className="system-update__tag">
                  {info?.version ? `v${info.version}` : "Lista para instalar"}
                </span>
              </div>
              <p id="system-update-message" className="system-update__message">
                {updateFailed
                  ? SYSTEM_UPDATE_BANNER_CONFIG.errorHint
                  : info?.mensaje || SYSTEM_UPDATE_BANNER_CONFIG.availableHint}
              </p>
              <button
                ref={actionRef}
                type="button"
                className="system-update__action"
                onClick={handleReload}
              >
                <MorphingIcon
                  icon={
                    updateFailed || requiresReload
                      ? RefreshCwIconData
                      : DownloadIconData
                  }
                  aria-hidden="true"
                />
                <span>
                  {updateFailed
                    ? SYSTEM_UPDATE_BANNER_CONFIG.retryLabel
                    : requiresReload
                      ? SYSTEM_UPDATE_BANNER_CONFIG.requiredActionLabel
                      : SYSTEM_UPDATE_BANNER_CONFIG.actionLabel}
                </span>
              </button>
            </div>

            {!requiresReload && (
              <button
                type="button"
                className="system-update__close"
                onClick={dismiss}
                aria-label="Recordar actualización después"
              >
                <MorphingIcon icon={XData} aria-hidden="true" />
              </button>
            )}
          </motion.section>
        </div>
      )}

      {isUpdating && (
        <div
          key="update-curtain"
          className="system-update-curtain"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy="true"
          data-testid="system-update-curtain"
        >
          <div className="system-update-curtain__content">
            <span className="system-update-curtain__icon-frame" aria-hidden="true">
              <MorphingIcon
                icon={LoaderCircleData}
                className="system-update-curtain__icon"
              />
            </span>
            <div className="system-update-curtain__copy">
              <p className="system-update-curtain__title">
                {SYSTEM_UPDATE_BANNER_CONFIG.updatingTitle}
              </p>
              <p className="system-update-curtain__hint">
                {SYSTEM_UPDATE_BANNER_CONFIG.updatingHint}
              </p>
            </div>
            <div
              className="system-update-curtain__progress"
              role="progressbar"
              aria-label={SYSTEM_UPDATE_BANNER_CONFIG.updatingTitle}
              aria-valuetext={SYSTEM_UPDATE_BANNER_CONFIG.updatingHint}
            >
              <span className="system-update-curtain__progress-fill" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
