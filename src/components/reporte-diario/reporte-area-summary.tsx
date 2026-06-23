import { useMemo, useState } from "react";
import { Users, TrendingDown, TrendingUp, Filter, ChevronRight } from "lucide-react";
import type { AreaDetailRow, AreaStaffSummary } from "./types";
import { INCIDENCIA_LABELS } from "./constants";
import { Modal } from "@/components/ui/Modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteAreaSummaryProps {
    areas: AreaStaffSummary[];
    selectedArea: string | null;
    onSelectArea: (area: string | null) => void;
    detailRows: AreaDetailRow[];
}

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-lg)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
        fontWeight: "var(--type-body-strong-weight)",
        fontSize: "var(--type-body-md-size)",
        lineHeight: "var(--type-body-md-line)",
        color: "var(--color-ink)",
    },
    clearBtn: {
        padding: "var(--spacing-xs) var(--spacing-sm)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
        borderRadius: "var(--rounded-full)",
        border: "1px solid var(--color-hairline)",
        background: "var(--color-surface-card)",
        color: "var(--color-charcoal)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-body-sm-line)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "var(--spacing-lg)",
    },
    areaCard: {
        base: {
            cursor: "pointer",
            textAlign: "left" as const,
            position: "relative" as const,
            padding: "var(--spacing-md)",
            borderRadius: "var(--rounded-lg)",
            border: "1px solid var(--color-hairline)",
            background: "var(--color-surface-card)",
            transition: "all var(--transition-base)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        },
        selected: {
            borderColor: "var(--color-primary)",
            background: "var(--color-surface-soft)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            transform: "translateY(-2px)",
        },
    },
    areaHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "var(--spacing-sm)",
        width: "100%",
    },
    areaName: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-caption-sm-line)",
        color: "var(--color-muted)",
        whiteSpace: "nowrap" as const,
        overflow: "hidden",
        textOverflow: "ellipsis",
        paddingRight: "var(--spacing-xs)",
        minWidth: 0,
    },
    incidentBadge: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "28px",
        minWidth: "28px",
        borderRadius: "var(--rounded-md)",
        padding: "0 var(--spacing-sm)",
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "1",
    },
    areaFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: "auto",
        width: "100%",
        paddingTop: "var(--spacing-sm)",
        borderTop: "1px solid var(--color-hairline-soft)",
    },
    staffCount: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-xxs)",
    },
    staffLabel: {
        fontSize: "var(--type-caption-sm-size)",
        lineHeight: "var(--type-caption-sm-line)",
        color: "var(--color-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
    },
    staffValue: {
        fontSize: "var(--type-heading-sm-size)",
        fontWeight: "var(--type-heading-sm-weight)",
        lineHeight: "var(--type-heading-sm-line)",
        color: "var(--color-ink)",
    },
    trend: {
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
    },
    trendValue: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    modalTableWrapper: {
        marginTop: "var(--spacing-md)",
        overflowY: "auto" as const,
        maxHeight: "60vh",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--rounded-lg)",
    },
    table: {
        minWidth: "100%",
        fontSize: "var(--type-body-sm-size)",
        lineHeight: "var(--type-body-sm-line)",
        borderCollapse: "collapse" as const,
    },
    thead: {
        background: "var(--color-surface-soft)",
        position: "sticky" as const,
        top: 0,
        zIndex: 10,
    },
    th: {
        padding: "var(--spacing-sm) var(--spacing-md)",
        textAlign: "left" as const,
        fontWeight: "var(--type-body-strong-weight)",
        color: "var(--color-muted)",
        borderBottom: "1px solid var(--color-hairline)",
        fontSize: "var(--type-caption-sm-size)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    tbody: {
        background: "var(--color-surface-card)",
    },
    tr: {
        borderBottom: "1px solid var(--color-hairline-soft)",
    },
    td: {
        base: {
            padding: "var(--spacing-sm) var(--spacing-md)",
        },
        number: {
            color: "var(--color-muted)",
            fontFamily: "var(--font-code)",
            fontSize: "var(--type-caption-sm-size)",
            lineHeight: "var(--type-caption-sm-line)",
        },
        name: {
            fontWeight: "var(--type-body-strong-weight)",
            color: "var(--color-ink)",
        },
        shift: {
            display: "inline-flex",
            alignItems: "center",
            borderRadius: "var(--rounded-full)",
            background: "var(--color-surface-soft)",
            padding: "var(--spacing-xxs) var(--spacing-sm)",
            fontSize: "var(--type-caption-sm-size)",
            lineHeight: "var(--type-caption-sm-line)",
        },
        dept: {
            color: "var(--color-muted)",
            fontSize: "var(--type-caption-sm-size)",
            lineHeight: "var(--type-caption-sm-line)",
        },
    },
    emptyCell: {
        padding: "var(--spacing-xl)",
        textAlign: "center" as const,
        color: "var(--color-muted)",
        fontSize: "var(--type-body-sm-size)",
        lineHeight: "var(--type-body-sm-line)",
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "var(--spacing-md)",
    },
} as const;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_THRESHOLDS = {
    critical: 15,
    warning: 5,
} as const;

const TREND_THRESHOLD = 10;

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface StatusColors {
    background: string;
    text: string;
    border: string;
}

function getStatusColors(pct: number, hasIncidents: boolean): StatusColors {
    if (!hasIncidents) {
        return {
            background: "var(--color-surface-soft)",
            text: "var(--color-muted)",
            border: "var(--color-hairline)",
        };
    }
    if (pct > STATUS_THRESHOLDS.critical) {
        return {
            background: "var(--color-error-tint)",
            text: "var(--color-error)",
            border: "var(--color-error)",
        };
    }
    if (pct > STATUS_THRESHOLDS.warning) {
        return {
            background: "var(--color-warning-tint)",
            text: "var(--color-warning)",
            border: "var(--color-warning)",
        };
    }
    return {
        background: "var(--color-primary-tint, rgba(0,0,0,0.05))",
        text: "var(--color-primary)",
        border: "var(--color-primary)",
    };
}

function getTrendColor(pct: number): string {
    return pct > TREND_THRESHOLD ? "var(--color-error)" : "var(--color-muted)";
}

// ─── Subcomponent: Area Card ───────────────────────────────────────────────────

interface AreaCardProps {
    area: AreaStaffSummary;
    isSelected: boolean;
    onClick: () => void;
}

function AreaCard({ area, isSelected, onClick }: AreaCardProps) {
    const pct = area.personal_activo > 0
        ? (area.personal_incidencia / area.personal_activo) * 100
        : 0;

    const status = getStatusColors(pct, area.personal_incidencia > 0);

    const cardStyle = {
        ...STYLES.areaCard.base,
        ...(isSelected ? STYLES.areaCard.selected : {}),
    };

    const badgeStyle = {
        ...STYLES.incidentBadge,
        backgroundColor: status.background,
        color: status.text,
    };

    const trendColor = getTrendColor(pct);

    return (
        <button
            key={area.area}
            type="button"
            onClick={onClick}
            className="reporte__card"
            style={cardStyle}
        >
            <div style={STYLES.areaHeader}>
                <span style={STYLES.areaName} title={area.area}>
                    {area.area}
                </span>
                <div style={badgeStyle}>
                    {area.personal_incidencia}
                </div>
            </div>

            <div style={STYLES.areaFooter}>
                <div style={STYLES.staffCount}>
                    <span style={STYLES.staffLabel}>Plantilla</span>
                    <span style={STYLES.staffValue}>{area.personal_activo}</span>
                </div>
                {area.personal_incidencia > 0 && (
                    <div style={STYLES.trend}>
                        {pct > TREND_THRESHOLD ? (
                            <TrendingUp size={12} style={{ color: "var(--color-error)" }} />
                        ) : (
                            <TrendingDown size={12} style={{ color: "var(--color-success)" }} />
                        )}
                        <span style={{ ...STYLES.trendValue, color: trendColor }}>
                            {pct.toFixed(0)}%
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
}

// ─── Subcomponent: Incidence Badge ─────────────────────────────────────────────

const INC_TONE: Record<string, "error" | "warn" | "info"> = {
    F: "error", S: "error", I: "error",
    FJ: "warn", P: "warn", PH: "warn", CT: "warn", TXT: "warn",
    V: "info",
};

function IncidenceBadge({ code }: { code: string }) {
    const tone = INC_TONE[code] ?? "warn";
    const label = INCIDENCIA_LABELS[code] ?? code;
    return <span className={`reporte-inc-badge reporte-inc-badge--${tone}`}>{label}</span>;
}

// ─── Subcomponent: Detail List (mobile cards + desktop table) ───────────────────

interface DetailListProps {
    rows: AreaDetailRow[];
}

function DetailList({ rows }: DetailListProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (rows.length === 0) {
        return (
            <div className="reporte-incidents__empty">
                <p>No hay ausencias registradas para esta área.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Desktop table */}
            <div className="reporte-incidents__table-wrap">
                <table className="reporte-incidents__table">
                    <thead>
                        <tr>
                            <th scope="col"># Emp</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Incidencia</th>
                            <th scope="col">Turno</th>
                            <th scope="col">Depto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <td className="reporte-incidents__td-num">{row.numero_empleado}</td>
                                <td className="reporte-incidents__td-name" title={row.nombre}>{row.nombre}</td>
                                <td><IncidenceBadge code={row.tipo_incidencia} /></td>
                                <td><span className="reporte-chip">{row.turno}</span></td>
                                <td title={row.departamento}>{row.departamento}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards with inline expand */}
            <ul className="reporte-incidents__cards" aria-label="Detalle de ausencias por empleado">
                {rows.map((row) => {
                    const isOpen = expanded.has(row.key);
                    const detailId = `area-detail-${row.key}`;
                    return (
                        <li key={row.key} className="reporte-incidents__card">
                            <button
                                type="button"
                                className="reporte-incidents__card-summary"
                                aria-expanded={isOpen}
                                aria-controls={detailId}
                                onClick={() => toggle(row.key)}
                                data-testid={`area-detail-card-${row.key}`}
                            >
                                <span className="reporte-incidents__card-main">
                                    <span className="reporte-incidents__card-name">{row.nombre}</span>
                                    <span className="reporte-incidents__card-tags">
                                        <IncidenceBadge code={row.tipo_incidencia} />
                                    </span>
                                </span>
                                <span className="reporte-chip">T{row.turno}</span>
                                <ChevronRight size={18} className="reporte-incidents__chevron" aria-hidden="true" />
                            </button>

                            {isOpen && (
                                <div id={detailId} className="reporte-incidents__card-detail">
                                    <span className="reporte-incidents__detail-label"># Empleado</span>
                                    <span className="reporte-incidents__detail-value">{row.numero_empleado}</span>
                                    <span className="reporte-incidents__detail-label">Departamento</span>
                                    <span className="reporte-incidents__detail-value">{row.departamento}</span>
                                    {row.puesto && (
                                        <>
                                            <span className="reporte-incidents__detail-label">Puesto</span>
                                            <span className="reporte-incidents__detail-value">{row.puesto}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteAreaSummary({
    areas,
    selectedArea,
    onSelectArea,
    detailRows,
}: ReporteAreaSummaryProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const sortedAreas = useMemo(
        () => [...areas].sort((a, b) => a.area.localeCompare(b.area, "es", { sensitivity: "base" })),
        [areas]
    );

    const handleSelectArea = (area: string) => {
        if (selectedArea === area) {
            onSelectArea(null);
        } else {
            onSelectArea(area);
            setIsDetailOpen(true);
        }
    };

    if (areas.length === 0) return null;

    return (
        <div style={STYLES.container}>
            {/* Header */}
            <div style={STYLES.header}>
                <div style={STYLES.headerTitle}>
                    <Users size={16} style={{ color: "var(--color-muted)" }} />
                    Impacto por Área
                </div>
                {selectedArea && (
                    <button
                        type="button"
                        onClick={() => onSelectArea(null)}
                        style={STYLES.clearBtn}
                    >
                        <Filter size={14} />
                        Limpiar filtro
                    </button>
                )}
            </div>

            {/* Grid */}
            <div
                className="reporte__layout"
                style={STYLES.grid}
            >
                {sortedAreas.map((area) => (
                    <AreaCard
                        key={area.area}
                        area={area}
                        isSelected={selectedArea === area.area}
                        onClick={() => handleSelectArea(area.area)}
                    />
                ))}
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen && selectedArea !== null}
                onClose={() => {
                    setIsDetailOpen(false);
                    onSelectArea(null);
                }}
                title={`Detalle de ausencias: ${selectedArea}`}
                subtitle={`Mostrando ${detailRows.length} colaboradores ausentes en esta área.`}
                size="lg"
                fullscreenMobile={true}
            >
                <div className="modal-body">
                    <DetailList rows={detailRows} />
                </div>
            </Modal>
        </div>
    );
}
