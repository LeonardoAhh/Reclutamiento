import { useMemo } from "react";
import { Users, CalendarX, MapPin } from "lucide-react";
import { formatMes, isIncidence } from "./helpers";
import type { ReporteRow } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteKpiDashboardProps {
    selectedRows: ReporteRow[];
    dayHeaders: string[];
    currentMonth: string;
}

type KpiTone = "default" | "warning" | "destructive";

interface KpiCard {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    tone: KpiTone;
}

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

function KpiCardItem({ card }: { card: KpiCard }) {
    const toneClass = card.tone !== "default" ? ` reporte-kpi__card--${card.tone}` : "";
    return (
        <article className={`reporte-kpi__card${toneClass}`} data-testid={`kpi-${card.tone}`}>
            <div className="reporte-kpi__icon-box" aria-hidden="true">{card.icon}</div>
            <div className="reporte-kpi__content">
                <span className="reporte-kpi__label">{card.label}</span>
                <div className="reporte-kpi__value-row">
                    <p className="reporte-kpi__value">{card.value}</p>
                    {card.sub && <p className="reporte-kpi__sub">{card.sub}</p>}
                </div>
            </div>
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
            icon: <Users size={18} />,
            tone: "default",
        },
        {
            label: "Total incidencias",
            value: kpis.totalIncidencias,
            sub: `en ${formatMes(currentMonth)}`,
            icon: <CalendarX size={18} />,
            tone: kpis.totalIncidencias > 0 ? "warning" : "default",
        },
        {
            label: "Día con más incidencias",
            value: getWorstDayLabel(kpis.worstDay, currentMonth),
            icon: <CalendarX size={18} />,
            tone: getTone(kpis.worstDayCount, { warning: 1, destructive: 6 }),
        },
        {
            label: "Área con más incidencias",
            value: kpis.worstArea || "—",
            icon: <MapPin size={18} />,
            tone: getTone(kpis.worstAreaCount, { warning: 1, destructive: 11 }),
        },
    ];

    return (
        <div className="reporte-kpi__grid">
            {cards.map((card) => (
                <KpiCardItem key={card.label} card={card} />
            ))}
        </div>
    );
}
