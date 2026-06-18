import { cn } from "@/lib/utils-shadcn";
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
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="reporte-card"
                style={{
                    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--spacing-md)', cursor: 'pointer', transition: 'all var(--transition-fast)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', height: 32, width: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--rounded-md)', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', transition: 'all var(--transition-fast)' }}>
                        <Database size={16} />
                    </div>
                    <p style={{ fontSize: 'var(--type-body-sm-size)', fontWeight: 'var(--type-body-strong-weight)', color: 'var(--color-ink)', margin: 0 }}>
                        Reportes guardados ({savedSummaries.length})
                    </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Reportes guardados"
                subtitle="Selecciona un reporte para cargarlo en pantalla."
                size="lg"
                fullscreenMobile={true}
            >
                <div style={{ padding: 'var(--spacing-lg)', maxHeight: '75vh', overflowY: 'auto' }}>
                    {savedSummaries.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl) 0', textAlign: 'center' }}>
                            <div style={{ display: 'flex', height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--rounded-full)', background: 'var(--color-surface-soft)', marginBottom: 'var(--spacing-md)' }}>
                                <Database size={20} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
                            </div>
                            <p style={{ fontSize: 'var(--type-body-sm-size)', fontWeight: 'var(--type-body-strong-weight)', color: 'var(--color-muted)', margin: 0 }}>
                                No hay reportes guardados
                            </p>
                            <p style={{ fontSize: 'var(--type-caption-sm-size)', color: 'var(--color-muted)', opacity: 0.7, marginTop: 4, margin: 0 }}>
                                Guarda un reporte para verlo aquí
                            </p>
                        </div>
                    ) : (
                        <div className="reporte-grid-2">
                            {savedSummaries.map((s) => (
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { onLoad(s.mes); setIsOpen(false); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { onLoad(s.mes); setIsOpen(false); } }}
                                    className="reporte-card"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-md)',
                                        padding: 'var(--spacing-md)', cursor: 'pointer', transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', minWidth: 0 }}>
                                        <div style={{ display: 'flex', height: 40, width: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--rounded-md)', background: 'var(--color-primary-tint)', color: 'var(--color-primary)', transition: 'all var(--transition-fast)' }}>
                                            <Calendar size={20} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <span style={{ fontSize: 'var(--type-body-sm-size)', fontWeight: 'var(--type-body-strong-weight)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {formatMes(s.mes)}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: 2, display: 'block' }}>
                                                Click para cargar
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexShrink: 0 }}>
                                        {/* Badge de incidencias */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <span style={{
                                                fontSize: 'var(--type-body-sm-size)', fontWeight: 'var(--type-body-strong-weight)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                                                color: s.total_incidencias > 50 ? 'var(--color-error)' : 'var(--color-ink)'
                                            }}>
                                                {s.total_incidencias}
                                            </span>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: 'var(--type-caption-sm-tracking)', color: 'var(--color-muted)', marginTop: 4 }}>
                                                incidencias
                                            </span>
                                        </div>

                                        {/* Separador + botón eliminar */}
                                        <div style={{ height: 32, width: 1, background: 'var(--color-hairline)', margin: '0 4px' }} />

                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
                                            disabled={dbSaving}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 'var(--rounded-md)', padding: 8, color: 'var(--color-muted)',
                                                opacity: dbSaving ? 0.5 : 0.4, cursor: dbSaving ? 'not-allowed' : 'pointer',
                                                transition: 'all var(--transition-fast)', border: 'none', background: 'transparent'
                                            }}
                                            aria-label="Eliminar reporte"
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-error-tint)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
