import { useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, CheckCircle2, Sparkles, ChevronRight } from "lucide-react";
import type { ReporteRow } from "./types";
import { Modal } from "@/components/ui/Modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteInsightsProps {
    selectedRows: ReporteRow[];
    dayHeaders: string[];
    dayAusentismoPct: Record<string, number>;
}

interface Insight {
    id: string;
    type: "danger" | "warning";
    icon: typeof AlertTriangle;
    message: string;
}

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
    trigger: {
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--spacing-md)",
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        background: "var(--color-surface-card)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
    },
    triggerInner: {
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)",
        textAlign: "left" as const,
        minWidth: 0,
    },
    triggerIcon: {
        display: "flex",
        height: "var(--control-height-lg)",
        width: "var(--control-height-lg)",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--rounded-md)",
        transition: "all var(--transition-fast)",
    },
    triggerIconAlert: {
        background: "var(--color-warning-tint)",
        color: "var(--color-warning)",
    },
    triggerIconNormal: {
        background: "var(--color-primary-tint, rgba(0,0,0,0.05))",
        color: "var(--color-primary)",
    },
    triggerText: {
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-body-sm-line)",
        color: "var(--color-ink)",
        margin: 0,
    },
    triggerCount: {
        color: "var(--color-muted)",
        fontWeight: "var(--type-body-md-weight)",
        marginLeft: "var(--spacing-xs)",
    },
    triggerChevron: {
        color: "var(--color-muted)",
        flexShrink: 0,
    },
    modalContent: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-sm)",
        marginTop: "var(--spacing-sm)",
    },
    insightItem: {
        base: {
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--spacing-md)",
            padding: "var(--spacing-md)",
            borderRadius: "var(--rounded-lg)",
            border: "1px solid",
        },
        danger: {
            background: "var(--color-error-tint)",
            borderColor: "var(--color-error)",
            color: "var(--color-error)",
        },
        warning: {
            background: "var(--color-warning-tint)",
            borderColor: "var(--color-warning)",
            color: "var(--color-warning)",
        },
    },
    insightIcon: {
        flexShrink: 0,
        marginTop: "2px",
    },
    insightMessage: {
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-body-sm-line)",
    },
    successBanner: {
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)",
        background: "var(--color-success-tint)",
        border: "1px solid var(--color-success)",
        color: "var(--color-success)",
        padding: "var(--spacing-md)",
        borderRadius: "var(--rounded-lg)",
    },
    successText: {
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-body-sm-line)",
        margin: 0,
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "var(--spacing-lg)",
    },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeInsights(
    selectedRows: ReporteRow[],
    dayHeaders: string[],
    dayAusentismoPct: Record<string, number>
): Insight[] {
    if (!selectedRows.length || !dayHeaders.length) return [];

    const insights: Insight[] = [];

    // 1. Top offenders (faltas)
    const offenders = selectedRows
        .map((row) => {
            let faltas = 0;
            for (const day of dayHeaders) {
                if (row.days[day] === "F") faltas++;
            }
            return { row, faltas };
        })
        .filter((o) => o.faltas >= 3)
        .sort((a, b) => b.faltas - a.faltas);

    offenders.slice(0, 3).forEach((o) => {
        insights.push({
            id: `offender-${o.row.numero_empleado}`,
            type: "danger",
            icon: AlertTriangle,
            message: `${o.row.nombre}: ${o.faltas} faltas`,
        });
    });

    // 2. Picos de ausentismo
    const percentages = Object.values(dayAusentismoPct).filter((p) => p > 0);
    if (percentages.length > 0) {
        const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length;

        for (const day of dayHeaders) {
            const pct = dayAusentismoPct[day] || 0;
            if (pct > 0 && pct >= avgPct + 5 && pct >= 10) {
                insights.push({
                    id: `peak-${day}`,
                    type: "warning",
                    icon: TrendingUp,
                    message: `Día ${parseInt(day, 10)}: Ausentismo alto (${pct}%)`,
                });
            }
        }
    }

    return insights;
}

// ─── Subcomponent: Trigger Button ──────────────────────────────────────────────

interface TriggerButtonProps {
    alertCount: number;
    onClick: () => void;
}

function TriggerButton({ alertCount, onClick }: TriggerButtonProps) {
    const hasAlerts = alertCount > 0;

    const iconStyle = {
        ...STYLES.triggerIcon,
        ...(hasAlerts ? STYLES.triggerIconAlert : STYLES.triggerIconNormal),
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="reporte__card"
            style={STYLES.trigger}
        >
            <div style={STYLES.triggerInner}>
                <div style={iconStyle}>
                    <Sparkles size={16} />
                </div>
                <p style={STYLES.triggerText}>
                    Análisis IA
                    {hasAlerts && (
                        <span style={STYLES.triggerCount}>
                            ({alertCount} alertas)
                        </span>
                    )}
                </p>
            </div>
            <ChevronRight size={16} style={STYLES.triggerChevron} />
        </button>
    );
}

// ─── Subcomponent: Insight Item ────────────────────────────────────────────────

interface InsightItemProps {
    insight: Insight;
}

function InsightItem({ insight }: InsightItemProps) {
    const isDanger = insight.type === "danger";
    const Icon = insight.icon;

    const itemStyle = {
        ...STYLES.insightItem.base,
        ...(isDanger ? STYLES.insightItem.danger : STYLES.insightItem.warning),
    };

    return (
        <div style={itemStyle}>
            <Icon size={20} style={STYLES.insightIcon} />
            <span style={STYLES.insightMessage}>{insight.message}</span>
        </div>
    );
}

// ─── Subcomponent: Success State ───────────────────────────────────────────────

function SuccessState() {
    return (
        <div style={STYLES.successBanner}>
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <p style={STYLES.successText}>
                Operación normal, sin alertas este mes.
            </p>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteInsights({
    selectedRows,
    dayHeaders,
    dayAusentismoPct,
}: ReporteInsightsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const insights = useMemo(
        () => computeInsights(selectedRows, dayHeaders, dayAusentismoPct),
        [selectedRows, dayHeaders, dayAusentismoPct]
    );

    if (!selectedRows.length) return null;

    return (
        <>
            <TriggerButton
                alertCount={insights.length}
                onClick={() => setIsOpen(true)}
            />

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={
                    <div className="reporte-flex-center">
                        <Sparkles size={20} style={{ color: "var(--color-primary)" }} />
                        Asistente Operativo
                    </div>
                }
                fullscreenMobile={true}
            >
                <div style={STYLES.modalContent}>
                    {insights.length === 0 ? (
                        <SuccessState />
                    ) : (
                        insights.map((insight) => (
                            <InsightItem key={insight.id} insight={insight} />
                        ))
                    )}
                </div>

                <div style={STYLES.modalFooter}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="btn-secondary"
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
        </>
    );
}
