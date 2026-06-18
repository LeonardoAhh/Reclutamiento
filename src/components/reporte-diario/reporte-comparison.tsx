import { useState } from "react";
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";
import { Modal } from "@/components/ui/Modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteComparisonDialogProps {
    summaries: ReporteDiarioSummary[];
}

interface MetricRowProps {
    label: string;
    value: string | number;
    valueColor?: string;
    showBar?: boolean;
    barValue?: number;
    barThreshold?: number;
}

interface TrendRowProps {
    label: string;
    diff: number;
    current: number;
    previous: number;
    suffix?: string;
    decimals?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

const AUSENTISMO_THRESHOLD = 2.5;

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
    triggerChevron: {
        color: "var(--color-muted)",
        flexShrink: 0,
    },
    modalBody: {
        padding: "var(--spacing-lg)",
        maxHeight: "75vh",
        overflowY: "auto" as const,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "var(--spacing-lg)",
    },
    card: {
        padding: "var(--spacing-md)",
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        background: "var(--color-surface-card)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--spacing-md)",
        paddingBottom: "var(--spacing-sm)",
        borderBottom: "1px solid var(--color-hairline)",
    },
    monthLabel: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
        margin: 0,
    },
    diffBadge: {
        base: {
            fontSize: "var(--type-caption-sm-size)",
            fontWeight: "var(--type-body-strong-weight)",
            textTransform: "uppercase" as const,
            padding: "var(--spacing-xxs) var(--spacing-sm)",
            borderRadius: "var(--rounded-full)",
            border: "1px solid",
            lineHeight: "var(--type-caption-sm-line)",
        },
        positive: {
            background: "var(--color-error-tint)",
            color: "var(--color-error)",
            borderColor: "var(--color-error)",
        },
        negative: {
            background: "var(--color-success-tint)",
            color: "var(--color-success)",
            borderColor: "var(--color-success)",
        },
        neutral: {
            background: "var(--color-surface-soft)",
            color: "var(--color-muted)",
            borderColor: "var(--color-hairline)",
        },
    },
    metricsList: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-sm)",
        fontSize: "var(--type-body-sm-size)",
        lineHeight: "var(--type-body-sm-line)",
    },
    metricRow: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-xs)",
    },
    metricRowInner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metricLabel: {
        color: "var(--color-muted)",
        fontSize: "var(--type-caption-sm-size)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    metricValue: {
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        fontVariantNumeric: "tabular-nums" as const,
        lineHeight: "var(--type-body-sm-line)",
    },
    progressBar: {
        track: {
            height: "var(--spacing-xs)",
            width: "100%",
            borderRadius: "var(--rounded-full)",
            background: "var(--color-surface-soft)",
            overflow: "hidden",
        },
        fill: {
            height: "100%",
            borderRadius: "var(--rounded-full)",
            transition: "all var(--transition-base)",
        },
    },
    trendsSection: {
        paddingTop: "var(--spacing-sm)",
        marginTop: "var(--spacing-xs)",
        borderTop: "1px solid var(--color-hairline)",
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-sm)",
    },
    trendRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    trendLabel: {
        fontSize: "var(--type-caption-sm-size)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    trendValue: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
    },
    trendNumber: {
        fontSize: "var(--type-caption-sm-size)",
        fontVariantNumeric: "tabular-nums" as const,
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "var(--spacing-lg)",
    },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatShortMes(ym: string): string {
    const [year, month] = ym.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1] ?? month} ${year}`;
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
    if (current > previous) return <TrendingUp size={14} style={{ color: "var(--color-error)" }} />;
    if (current < previous) return <TrendingDown size={14} style={{ color: "var(--color-success)" }} />;
    return <Minus size={14} style={{ color: "var(--color-muted)" }} />;
}

function getDiffBadgeStyle(diff: number) {
    if (diff > 0) return { ...STYLES.diffBadge.base, ...STYLES.diffBadge.positive };
    if (diff < 0) return { ...STYLES.diffBadge.base, ...STYLES.diffBadge.negative };
    return { ...STYLES.diffBadge.base, ...STYLES.diffBadge.neutral };
}

function getProgressColor(value: number, threshold: number): string {
    if (value > threshold * 2) return "var(--color-error)";
    if (value > threshold) return "var(--color-warning)";
    return "var(--color-success)";
}

function getValueColor(value: number, threshold: number): string {
    if (value > threshold) return "var(--color-error)";
    return "var(--color-ink)";
}

// ─── Subcomponent: Trigger Button ──────────────────────────────────────────────

function TriggerButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="reporte__card"
            style={STYLES.trigger}
        >
            <div style={STYLES.triggerInner}>
                <div style={STYLES.triggerIcon}>
                    <BarChart3 size={16} />
                </div>
                <p style={STYLES.triggerText}>Comparativa mensual</p>
            </div>
            <ChevronRight size={16} style={STYLES.triggerChevron} />
        </button>
    );
}

// ─── Subcomponent: Month Card ──────────────────────────────────────────────────

interface MonthCardProps {
    summary: ReporteDiarioSummary;
    previous: ReporteDiarioSummary | null;
}

function MonthCard({ summary, previous }: MonthCardProps) {
    const incDiff = previous ? summary.total_incidencias - previous.total_incidencias : 0;
    const ausDiff = previous ? summary.pct_ausentismo - previous.pct_ausentismo : 0;

    const diffBadgeStyle = getDiffBadgeStyle(incDiff);

    return (
        <div className="reporte__card" style={STYLES.card}>
            <div style={STYLES.cardHeader}>
                <p style={STYLES.monthLabel}>{formatShortMes(summary.mes)}</p>
                {previous && (
                    <span style={diffBadgeStyle}>
                        {incDiff > 0 ? "+" : ""}{incDiff} inc.
                    </span>
                )}
            </div>

            <div style={STYLES.metricsList}>
                <MetricRow label="Empleados" value={summary.total_empleados} />
                <MetricRow label="Días disponibles" value={summary.dias_disponibles} />
                <MetricRow
                    label="Total ausentismo"
                    value={summary.total_ausentismo}
                    valueColor={summary.total_ausentismo > 0 ? "var(--color-error)" : "var(--color-ink)"}
                />
                <MetricRow
                    label="% Ausentismo"
                    value={`${summary.pct_ausentismo.toFixed(2)}%`}
                    valueColor={getValueColor(summary.pct_ausentismo, AUSENTISMO_THRESHOLD)}
                    showBar
                    barValue={summary.pct_ausentismo}
                    barThreshold={AUSENTISMO_THRESHOLD}
                />
                <MetricRow
                    label="Incidencias"
                    value={summary.total_incidencias}
                    valueColor={summary.total_incidencias > 50 ? "var(--color-error)" : "var(--color-ink)"}
                />

                {previous && (
                    <div style={STYLES.trendsSection}>
                        <TrendRow
                            label="Tend. incidencias"
                            diff={incDiff}
                            current={summary.total_incidencias}
                            previous={previous.total_incidencias}
                            suffix=""
                        />
                        <TrendRow
                            label="Tend. ausentismo"
                            diff={ausDiff}
                            current={summary.pct_ausentismo}
                            previous={previous.pct_ausentismo}
                            suffix="%"
                            decimals={2}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Subcomponent: Metric Row ──────────────────────────────────────────────────

function MetricRow({
    label,
    value,
    valueColor = "var(--color-ink)",
    showBar,
    barValue,
    barThreshold,
}: MetricRowProps) {
    return (
        <div style={STYLES.metricRow}>
            <div style={STYLES.metricRowInner}>
                <span style={STYLES.metricLabel}>{label}</span>
                <span style={{ ...STYLES.metricValue, color: valueColor }}>{value}</span>
            </div>
            {showBar && barValue !== undefined && (
                <div style={STYLES.progressBar.track}>
                    <div
                        style={{
                            ...STYLES.progressBar.fill,
                            background: getProgressColor(barValue, barThreshold || AUSENTISMO_THRESHOLD),
                            width: `${Math.min(barValue * 10, 100)}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Subcomponent: Trend Row ───────────────────────────────────────────────────

function TrendRow({
    label,
    diff,
    current,
    previous,
    suffix = "",
    decimals = 0,
}: TrendRowProps) {
    const formattedDiff = decimals > 0 ? diff.toFixed(decimals) : String(diff);
    const color = diff > 0 ? "var(--color-error)" : diff < 0 ? "var(--color-success)" : "var(--color-muted)";

    return (
        <div style={STYLES.trendRow}>
            <span style={STYLES.trendLabel}>{label}</span>
            <span style={STYLES.trendValue}>
                <TrendIcon current={current} previous={previous} />
                <span style={{ ...STYLES.trendNumber, color }}>
                    {diff > 0 ? "+" : ""}{formattedDiff}{suffix}
                </span>
            </span>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteComparisonDialog({
    summaries,
}: ReporteComparisonDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (summaries.length < 2) return null;

    const sorted = [...summaries].sort((a, b) => a.mes.localeCompare(b.mes));

    return (
        <>
            <TriggerButton onClick={() => setIsOpen(true)} />

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Comparativa mensual"
                subtitle="Evolución de incidencias y asistencia mes a mes."
                size="xl"
                fullscreenMobile={true}
            >
                <div style={STYLES.modalBody}>
                    <div className="reporte__layout reporte__layout--thirds" style={STYLES.grid}>
                        {sorted.map((summary, index) => (
                            <MonthCard
                                key={summary.id}
                                summary={summary}
                                previous={index > 0 ? sorted[index - 1] : null}
                            />
                        ))}
                    </div>
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
