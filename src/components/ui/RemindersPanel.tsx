import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCandidates } from "@/hooks/useCandidates";
import { CandidateStatusBadge } from "@/components/ui/CandidateStatusBadge";
import { localTodayIso, addDaysToIso, formatReadableDate } from "@/lib/dates";
import { CandidateModal } from "./CandidateModal";
import { EASE_OUT } from "@/lib/motion";
import type { Candidate } from "@/lib/types";
import "./RemindersPanel.css";

function formatReminderDate(fecha: string | null | undefined) {
  if (!fecha) return "";
  const today = localTodayIso();
  const yesterday = addDaysToIso(today, -1);

  if (fecha === today) return "Hoy";
  if (fecha === yesterday) return "Ayer";

  return formatReadableDate(fecha).replace(/\s\d{4}$/, "");
}

export function RemindersPanel() {
  const { candidates, updateCandidate } = useCandidates();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const getFocusableItems = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [];
    const focusFrame = requestAnimationFrame(() => {
      const firstItem = getFocusableItems()[0];
      if (firstItem) {
        firstItem.focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableItems = getFocusableItems();
      if (focusableItems.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [isOpen]);

  const reminders = useMemo(() => {
    const today = localTodayIso();
    return candidates
      .filter((c) => {
        // 1. Solo estados que requieran seguimiento
        const isActive = [
          "entrevista",
          "entrega_documentos",
          "faltan_documentos",
          "feedback_pendiente",
        ].includes(c.status);
        if (!isActive) return false;

        // 2. Que tenga fecha_cita y que sea <= hoy (es decir, ya pasó o es hoy)
        if (!c.fecha_cita) return false;

        return c.fecha_cita <= today;
      })
      .sort((a, b) => a.fecha_cita!.localeCompare(b.fecha_cita!));
  }, [candidates]);

  const handleUpdate = async (
    payload: Omit<Candidate, "id" | "created_at" | "updated_at">,
    id?: string,
  ) => {
    if (!id) return { ok: false };
    return updateCandidate(id, payload);
  };

  const nowStr = useMemo(() => {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`reminders-bell ${reminders.length > 0 ? "has-reminders" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Ver recordatorios"
        aria-expanded={isOpen}
        aria-controls="reminders-dialog"
      >
        {reminders.length > 0 ? (
          <>
            <BellRing size={20} strokeWidth={2} />
            <span className="type-body-sm font-medium reminders-bell-text">
              Procesos
            </span>
            <span className="reminders-badge">
              {reminders.length > 99 ? "99+" : reminders.length}
            </span>
          </>
        ) : (
          <>
            <Bell size={20} strokeWidth={2} />
            <span className="type-body-sm font-medium reminders-bell-text">
              Procesos
            </span>
          </>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="reminders-overlay popover-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={dialogRef}
                id="reminders-dialog"
                className="reminders-popover"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reminders-title"
                tabIndex={-1}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ ease: EASE_OUT, duration: 0.2 }}
              >
                <div className="reminders-header">
                  <h2 id="reminders-title">Procesos</h2>
                  <span
                    className="text-muted type-caption-sm"
                    style={{ fontSize: "11px", textTransform: "capitalize" }}
                  >
                    {nowStr}
                  </span>
                </div>

                <div className="reminders-content">
                  {reminders.length === 0 ? (
                    <div className="reminders-empty" role="status">
                      <CheckCircle2 size={32} />
                      <p>Sin procesos</p>
                    </div>
                  ) : (
                    <div className="reminders-list">
                      {reminders.map((c) => (
                        <button
                          key={c.id}
                          className="reminder-compact-item"
                          onClick={() => {
                            setIsOpen(false);
                            setSelectedCandidate(c);
                          }}
                        >
                          <div className="reminder-compact-main">
                            <span
                              className="type-body-sm font-medium truncate"
                              title={c.nombre}
                            >
                              {c.nombre}
                            </span>
                          </div>
                          <div className="reminder-compact-sub">
                            <span
                              className="type-caption-sm text-muted truncate"
                              title={`${c.reclutador || "General"} • ${c.fecha_cita}`}
                            >
                              {c.reclutador
                                ? c.reclutador.split(" ")[0]
                                : "General"}
                              <span
                                className="text-faint"
                                style={{ margin: "0 4px" }}
                              >
                                •
                              </span>
                              <span className="text-faint">
                                {formatReminderDate(c.fecha_cita)}
                              </span>
                            </span>
                            <CandidateStatusBadge status={c.status} compact />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {selectedCandidate && (
        <CandidateModal
          isOpen={true}
          mode="edit"
          candidate={selectedCandidate}
          candidates={candidates}
          onClose={() => setSelectedCandidate(null)}
          onSave={handleUpdate}
        />
      )}
    </>
  );
}
