import "./ReporteDiario.css";
import {
  Calendar,
  CalendarDays,
  CircleCheckBig,
  ChevronRight,
  Database,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

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
}

export default function ReportesGuardadosDialog({
  savedSummaries,
  dbSaving,
  onLoad,
  onDelete,
  formatMes,
  triggerVariant = "icon",
}: ReportesGuardadosDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const count = savedSummaries.length;
  const label =
    count === 1 ? "1 reporte guardado" : `${count} reportes guardados`;

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
          data-testid="open-saved-reports-btn"
        >
          <Database size={16} aria-hidden="true" />
          <span className="reporte-saved__trigger-label">Reportes</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="reporte-saved__trigger reporte-saved__trigger--icon"
          aria-label={`Reportes guardados (${count})`}
          title="Reportes guardados"
          data-testid="open-saved-reports-btn"
        >
          <Database size={16} aria-hidden="true" />
          <span className="reporte-saved__count" aria-hidden="true">
            {count}
          </span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="REPORTES GUARDADOS"
        size="sm"
        fullscreenMobile={true}
      >
        <div className="reporte-saved__body">
          {savedSummaries.length === 0 ? (
            <div className="reporte-saved__empty">
              <span className="reporte-saved__empty-icon">
                <Database size={20} aria-hidden="true" />
              </span>
              <p className="reporte-saved__empty-title">
                No hay reportes guardados
              </p>
              <p className="reporte-saved__empty-sub">
                Guarda un reporte para verlo aquí.
              </p>
            </div>
          ) : (
            <ul className="reporte-saved__list" aria-label="Reportes guardados">
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
                    aria-label={`Eliminar reporte ${formatMes(s.mes)}`}
                    data-testid={`delete-report-${s.mes}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={pendingDelete !== null}
        title="Eliminar reporte"
        onConfirm={() => void confirmDeletion()}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        isLoading={isDeleting || dbSaving}
      />
    </>
  );
}
