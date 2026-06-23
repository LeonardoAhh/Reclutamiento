import './ReporteDiario.css';
import { Database, ChevronRight, Calendar, Trash2 } from "lucide-react"
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface SavedSummary {
    id: string
    mes: string
    total_incidencias: number
}

interface ReportesGuardadosDialogProps {
    savedSummaries: SavedSummary[]
    dbSaving: boolean
    onLoad: (mes: string) => void
    onDelete: (id: string) => void
    formatMes: (mes: string) => string
}

export default function ReportesGuardadosDialog({
    savedSummaries,
    dbSaving,
    onLoad,
    onDelete,
    formatMes,
}: ReportesGuardadosDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="reporte-saved__trigger"
                data-testid="open-saved-reports-btn"
            >
                <span className="reporte-saved__trigger-left">
                    <span className="reporte-saved__trigger-icon">
                        <Database size={16} />
                    </span>
                    <span className="reporte-saved__trigger-text">
                        Reportes guardados ({savedSummaries.length})
                    </span>
                </span>
                <ChevronRight size={16} className="reporte-saved__trigger-chevron" aria-hidden="true" />
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Reportes guardados"
                subtitle="Selecciona un reporte para cargarlo en pantalla."
                size="lg"
                fullscreenMobile={true}
            >
                <div className="modal-body">
                    {savedSummaries.length === 0 ? (
                        <div className="reporte-saved__empty">
                            <span className="reporte-saved__empty-icon">
                                <Database size={20} aria-hidden="true" />
                            </span>
                            <p className="reporte-saved__empty-title">No hay reportes guardados</p>
                            <p className="reporte-saved__empty-sub">Guarda un reporte para verlo aquí.</p>
                        </div>
                    ) : (
                        <ul className="reporte-saved__list" aria-label="Reportes guardados">
                            {savedSummaries.map((s) => (
                                <li key={s.id} className="reporte-saved__item">
                                    <button
                                        type="button"
                                        className="reporte-saved__load"
                                        onClick={() => { onLoad(s.mes); setIsOpen(false); }}
                                        data-testid={`load-report-${s.mes}`}
                                    >
                                        <span className="reporte-saved__icon">
                                            <Calendar size={18} aria-hidden="true" />
                                        </span>
                                        <span className="reporte-saved__main">
                                            <span className="reporte-saved__title">{formatMes(s.mes)}</span>
                                            <span className="reporte-saved__sub">Click para cargar</span>
                                        </span>
                                        <span className="reporte-saved__count">
                                            <span className={`reporte-saved__count-value${s.total_incidencias > 50 ? " reporte-saved__count-value--high" : ""}`}>
                                                {s.total_incidencias}
                                            </span>
                                            <span className="reporte-saved__count-label">incidencias</span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
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
        </>
    )
}
