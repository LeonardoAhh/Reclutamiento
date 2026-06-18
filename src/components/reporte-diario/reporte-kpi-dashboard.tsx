import { cn } from "@/lib/utils-shadcn";
import { useMemo } from "react";
import { Users, TrendingDown, CalendarX, MapPin } from "lucide-react";
import { isIncidence, formatMes } from "./helpers";
import type { ReporteRow } from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

const KPI_TONES = {
    default: {
        borderColor: "var(--color-hairline)",
        iconColor: "var(--color-muted)",
        valueColor: "var(--color-ink)",
    },
    warning: {
        borderColor: "var(--color-warning)",
        iconColor: "var(--color-warning)",
        valueColor: "var(--color-ink)",
    },
    destructive: {
        borderColor: "var(--color-error)",
        iconColor: "var(--color-error)",
        valueColor: "var(--color-error)",
    },
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteKpiDashboardProps {
    selectedRows: ReporteRow[];
    dayHeaders: string[];
    currentMonth: string;
}

type KpiTone = keyof typeof KPI_TONES;

interface KpiCard {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    tone: KpiTone;
}

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
    layout: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--spacing-lg)",
    },
    layoutDesktop: {
        gridTemplateColumns: "repeat(4, 1fr)",
    },
    card: {
        padding: "var(--spacing-md)",
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        background: "var(--color-surface-card)",
        display: "flex",
        flexDirection: "column" as const,
        gap: "var(--spacing-xs)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    icon: {
        opacity: 0.6,
        display: "flex",
        alignItems: "center",
    },
    value: {
        fontFamily: "var(--font-display)",
        fontSize: "var(--type-display-lg-size)",
        fontWeight: "var(--type-display-lg-weight)",
        lineHeight: "var(--type-display-lg-line)",
        letterSpacing: "var(--type-display-lg-tracking)",
        margin: 0,
    },
    sub: {
        fontSize: "var(--type-caption-sm-size)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
        margin: 0,
    },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWorstDayLabel(worstDay: string, currentMonth: string): string {
    if (!worstDay) return "—";
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1, parseInt(worstDay, 10));
    const weekday = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][date.getDay()];
    return `${weekday} ${parseInt(worstDay, 10)}`;
}

function computeKpis(
    selectedRows: ReporteRow[],
    dayHeaders: string[],
    currentMonth: string
) {
    if (!selectedRows.length || !currentMonth) return null;

    const totalEmpleados = selectedRows.length;
    let totalIncidencias = 0;
    let totalAsistencias = 0;
    let totalDaysTracked = 0;
    const incidentsByDay: Record<string, number> = {};
    const incidentsByArea: Record<string, number> = {};

    for (const row of selectedRows) {
        for (const day of dayHeaders) {
            const code = row.days[day];
            if (!code || code === "-" || code === "X") continue;
            totalDaysTracked++;
            if (code === "A") {
                totalAsistencias++;
            } else if (isIncidence(code)) {
                totalIncidencias++;
                incidentsByDay[day] = (incidentsByDay[day] ?? 0) + 1;
                incidentsByArea[row.area] = (incidentsByArea[row.area] ?? 0) + 1;
            }
        }
    }

    const tasaAsistencia = totalDaysTracked > 0
        ? Math.round((totalAsistencias / totalDaysTracked) * 100)
        : 0;

    let worstDay = "";
    let worstDayCount = 0;
    for (const [day, count] of Object.entries(incidentsByDay)) {
        if (count > worstDayCount) {
            worstDay = day;
            worstDayCount = count;
        }
    }

    let worstArea = "";
    let worstAreaCount = 0;
    for (const [area, count] of Object.entries(incidentsByArea)) {
        if (count > worstAreaCount) {
            worstArea = area;
            worstAreaCount = count;
        }
    }

    return {
        totalEmpleados,
        totalIncidencias,
        tasaAsistencia,
        worstDay,
        worstDayCount,
        worstArea,
        worstAreaCount,
    };
}

function getTone(count: number, thresholds: { warning: number; destructive: number }): KpiTone {
    if (count >= thresholds.destructive) return "destructive";
    if (count >= thresholds.warning) return "warning";
    return "default";
}

// ─── Subcomponent: KpiCard ─────────────────────────────────────────────────────

interface KpiCardProps {
    card: KpiCard;
}

function KpiCardItem({ card }: KpiCardProps) {
    const tone = KPI_TONES[card.tone];

    const cardStyle = {
        ...STYLES.card,
        borderColor: tone.borderColor,
    };

    const iconStyle = {
        ...STYLES.icon,
        color: tone.iconColor,
    };

    const valueStyle = {
        ...STYLES.value,
        color: tone.valueColor,
    };

    return (
        <article className="reporte__card" style={cardStyle}>
            <div style={STYLES.cardHeader}>
                <span style={STYLES.label}>{card.label}</span>
                <span style={iconStyle}>{card.icon}</span>
            </div>
            <p style={valueStyle}>{card.value}</p>
            {card.sub && <p style={STYLES.sub}>{card.sub}</p>}
        </article>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteKpiDashboard({
    selectedRows,
    dayHeaders,
    currentMonth,
}: ReporteKpiDashboardProps) {
    const kpis = useMemo(
        () => computeKpis(selectedRows, dayHeaders, currentMonth),
        [selectedRows, dayHeaders, currentMonth]
    );

    if (!kpis) return null;

    const cards: KpiCard[] = [
        {
            label: "Empleados",
            value: kpis.totalEmpleados,
            sub: `en ${formatMes(currentMonth)}`,
            icon: <Users className="w-5 h-5" />,
            tone: "default",
        },
        {
            label: "Total incidencias",
            value: kpis.totalIncidencias,
            sub: `en ${formatMes(currentMonth)}`,
            icon: <CalendarX className="w-5 h-5" />,
            tone: kpis.totalIncidencias > 0 ? "warning" : "default",
        },
        {
            label: "Día con más incidencias",
            value: getWorstDayLabel(kpis.worstDay, currentMonth),
            sub: kpis.worstDay
                ? `${kpis.worstDayCount} incidencias en ${formatMes(currentMonth)}`
                : undefined,
            icon: <CalendarX className="w-5 h-5" />,
            tone: getTone(kpis.worstDayCount, { warning: 1, destructive: 6 }),
        },
        {
            label: "Área con más incidencias",
            value: kpis.worstArea || "—",
            sub: kpis.worstArea ? `${kpis.worstAreaCount} incidencias` : undefined,
            icon: <MapPin className="w-5 h-5" />,
            tone: getTone(kpis.worstAreaCount, { warning: 1, destructive: 11 }),
        },
    ];

    return (
        <div
            className="reporte__layout reporte__layout--quarters"
            style={STYLES.layout}
        >
            {cards.map((card) => (
                <KpiCardItem key={card.label} card={card} />
            ))}
        </div>
    );
}
