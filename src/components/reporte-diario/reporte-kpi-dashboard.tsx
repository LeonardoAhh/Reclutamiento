import { useMemo } from "react";
import { BadgeAlert, Building2, CalendarX2, UsersRound } from 'lucide-react';
import { isIncidence } from "./helpers";
import { useReportLocale } from "./useReportLocale";
import type { ReporteRow } from "./types";
import { KpiCard, type KpiTone } from "@/components/ui/KpiCard";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteKpiDashboardProps {
    selectedRows: ReporteRow[];
    dayHeaders: string[];
    currentMonth: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWorstDayLabel(worstDay: string, currentMonth: string, en: boolean): string {
    if (!worstDay) return "—";
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1, parseInt(worstDay, 10));
    const weekday = (en
        ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        : ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"])[date.getDay()];
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteKpiDashboard({
    selectedRows,
    dayHeaders,
    currentMonth,
} : ReporteKpiDashboardProps) {
    const { en, copy, month } = useReportLocale();

    const kpis = useMemo(
        () => computeKpis(selectedRows, dayHeaders, currentMonth),
        [selectedRows, dayHeaders, currentMonth]
    );

    if (!kpis) return null;

    const cards = [
        {
            label: copy("Empleados", "Employees"),
            value: kpis.totalEmpleados,
            valueSize: "compact" as const,
            sub: `${copy("en", "in")} ${month(currentMonth)}`,
            icon: <UsersRound size={18} />,
            tone: "default" as KpiTone,
        },
        {
            label: copy("Total incidencias", "Total incidents"),
            value: kpis.totalIncidencias,
            valueSize: "compact" as const,
            sub: `${copy("en", "in")} ${month(currentMonth)}`,
            icon: <BadgeAlert size={18} />,
            tone: (kpis.totalIncidencias > 0 ? "warning" : "default") as KpiTone,
        },
        {
            label: copy("Día con más incidencias", "Day with most incidents"),
            value: getWorstDayLabel(kpis.worstDay, currentMonth, en),
            valueSize: "compact" as const,
            icon: <CalendarX2 size={18} />,
            tone: getTone(kpis.worstDayCount, { warning: 1, destructive: 6 }),
        },
        {
            label: copy("Área con más incidencias", "Area with most incidents"),
            value: kpis.worstArea || "—",
            valueSize: "compact" as const,
            icon: <Building2 size={18} />,
            tone: getTone(kpis.worstAreaCount, { warning: 1, destructive: 11 }),
        },
    ];

    return (
        <div className="reporte-kpi__grid">
            {cards.map((card) => (
                <KpiCard key={card.label} {...card} />
            ))}
        </div>
    );
}
