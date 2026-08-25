import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, BellRing, CheckCircle2 } from "lucide-react";
import { useCandidates } from "@/hooks/useCandidates";
import { CandidateStatusBadge } from "@/components/ui/CandidateStatusBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { localTodayIso, addDaysToIso, formatReadableDate } from "@/lib/dates";
import { CandidateModal } from "./CandidateModal";
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
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`reminders-bell ${reminders.length > 0 ? "has-reminders" : ""}`}
            aria-label={
              isOpen ? "Cerrar procesos pendientes" : "Ver procesos pendientes"
            }
          >
            {reminders.length > 0 ? (
              <>
                <BellRing
                  size="var(--icon-size-md)"
                  aria-hidden="true"
                />
                <span className="type-body-sm font-medium reminders-bell-text">
                  Procesos
                </span>
                <span className="reminders-badge">
                  {reminders.length > 99 ? "99+" : reminders.length}
                </span>
              </>
            ) : (
              <>
                <Bell
                  size="var(--icon-size-md)"
                  aria-hidden="true"
                />
                <span className="type-body-sm font-medium reminders-bell-text">
                  Procesos
                </span>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="reminders-popover"
          align="end"
          aria-labelledby="reminders-title"
        >
          <div className="reminders-header">
            <h2 id="reminders-title">Procesos</h2>
            <span className="text-muted reminders-timestamp">{nowStr}</span>
          </div>

          <div className="reminders-content">
            {reminders.length === 0 ? (
              <div className="reminders-empty" role="status">
                <CheckCircle2
                  size="var(--icon-size-xxl)"
                  aria-hidden="true"
                />
                <p>Sin procesos</p>
              </div>
            ) : (
              <div className="reminders-list">
                {reminders.map((c) => (
                  <button
                    type="button"
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
                          className="text-faint reminder-compact-separator"
                          aria-hidden="true"
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
        </PopoverContent>
      </Popover>

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
