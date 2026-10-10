import "./ReporteDiario.css";
import {
  Archive,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormSheet } from "@/components/ui/FormSheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useReportLocale } from "./useReportLocale";

interface SavedSummary {
  id: string;
  mes: string;
  total_incidencias: number;
}

interface ReportesGuardadosDialogProps {
  savedSummaries: SavedSummary[];
  dbSaving: boolean;
  onLoad: (mes: string) => void;
  onDelete: (id: string) => void | Promise<void>;
  formatMes: (mes: string) => string;
  /** "icon" (default): botón compacto ícono + contador · "labeled": ícono + texto */
  triggerVariant?: "icon" | "labeled";
  triggerLabel?: string;
}

export default function ReportesGuardadosDialog({
  savedSummaries,
  dbSaving,
  onLoad,
  onDelete,
  formatMes,
  triggerVariant = "icon",
  triggerLabel,
}: ReportesGuardadosDialogProps) {
  const isMobile = useIsMobile();
  const Dialog = isMobile ? Modal : FormSheet;
  const { copy } = useReportLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const count = savedSummaries.length;
  const label =
    count === 1 ? copy("1 reporte guardado", "1 saved report") : `${count} ${copy("reportes guardados", "saved reports")}`;

  async function confirmDeletion() {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      {triggerVariant === "labeled" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="reporte-saved__trigger reporte-saved__trigger--labeled"
          aria-label={label}
          ref={triggerRef}
          data-testid="open-saved-reports-btn"
        >
          <Archive size={16} aria-hidden="true" />
          <span className="reporte-saved__trigger-label">{triggerLabel ?? copy("Reportes", "Reports")}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="reporte-saved__trigger reporte-saved__trigger--icon"
          aria-label={`${copy("Reportes guardados", "Saved reports")} (${count})`}
          title={copy("Reportes guardados", "Saved reports")}
          ref={triggerRef}
          data-testid="open-saved-reports-btn"
        >
          <Archive size={16} aria-hidden="true" />
          <span className="reporte-saved__count" aria-hidden="true">
            {count}
          </span>
        </button>
      )}

      <Dialog
        className="report-dialog"
        isOpen={isOpen && (isMobile || pendingDelete === null)}
        {...(isMobile ? {} : { returnFocusRef: triggerRef })}
        onClose={() => setIsOpen(false)}
        title={copy("Reportes guardados", "Saved reports")}
        size="sm"
      >
        <div className="reporte-saved__body">
          {savedSummaries.length === 0 ? (
            <div className="reporte-saved__empty">
              <span className="reporte-saved__empty-icon">
                <Archive size={20} aria-hidden="true" />
              </span>
              <p className="reporte-saved__empty-title">
                {copy("No hay reportes guardados", "No saved reports")}
              </p>
              <p className="reporte-saved__empty-sub">
                {copy("Guarda un reporte para verlo aquí.", "Save a report to see it here.")}
              </p>
            </div>
          ) : (
            <ul className="reporte-saved__list" aria-label={copy("Reportes guardados", "Saved reports")}>
              {savedSummaries.map((s) => (
                <li key={s.id} className="reporte-saved__item">
                  <button
                    type="button"
                    className="reporte-saved__load"
                    onClick={() => {
                      onLoad(s.mes);
                      setIsOpen(false);
                    }}
                    data-testid={`load-report-${s.mes}`}
                  >
                    <span className="reporte-saved__icon">
                      <CalendarDays size={18} aria-hidden="true" />
                    </span>
                    <span className="reporte-saved__main">
                      <span className="reporte-saved__title reporte-saved__title--uppercase">
                        {formatMes(s.mes)}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(s);
                    }}
                    disabled={dbSaving}
                    className="reporte-saved__delete"
                    aria-label={`${copy("Eliminar reporte", "Delete report")} ${formatMes(s.mes)}`}
                    data-testid={`delete-report-${s.mes}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>

      <DeleteConfirmModal
        className="report-dialog"
        isOpen={pendingDelete !== null}
        title={copy("Eliminar reporte", "Delete report")}
        onConfirm={() => void confirmDeletion()}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        isLoading={isDeleting || dbSaving}
      />
    </>
  );
}
