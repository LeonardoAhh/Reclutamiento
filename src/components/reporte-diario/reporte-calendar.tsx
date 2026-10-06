import { useReportLocale } from "./useReportLocale";

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEK_DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export const AUSENTISMO_THRESHOLD = 2.5;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ReporteCalendarProps {
    calendarCells: (string | null)[];
    daySummaries: Record<string, number>;
    dayAusentismoPct: Record<string, number>;
    selectedDay: string;
    selectedMonthHolidayLabels: Record<string, string>;
    currentMonth: string;
    ausentismoThreshold?: number;
    onSelectDay: (day: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type HeatLevel = "crit" | "warn" | "ok" | "none";

function getHeatLevel(ausPct: number | undefined, threshold: number): HeatLevel {
    if (ausPct === undefined) return "none";
    if (ausPct > threshold * 2) return "crit";
    if (ausPct > threshold) return "warn";
    return "ok";
}

// ─── Subcomponent: Weekday Headers ─────────────────────────────────────────────

function WeekDayHeaders() {
    const { en } = useReportLocale();
    const names = en ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : WEEK_DAY_NAMES;
    return (
        <div className="reporte-cal__weekdays" role="row">
            {names.map((name) => (
                <div
                    key={name}
                    role="columnheader"
                    aria-label={name}
                    className="reporte-cal__weekday"
                >
                    {name}
                </div>
            ))}
        </div>
    );
}

// ─── Subcomponent: Day Cell ──────────────────────────────────────────────────

interface DayCellProps {
    day: string;
    count: number;
    ausPct: number | undefined;
    active: boolean;
    holidayLabel: string | undefined;
    threshold: number;
    onSelectDay: (day: string) => void;
}

function DayCell({
    day,
    count,
    ausPct,
    active,
    holidayLabel,
    threshold,
    onSelectDay,
}: DayCellProps) {
    const { copy, holiday } = useReportLocale();
    const hasAus = ausPct !== undefined;
    const dayNumber = parseInt(day, 10);
    const hasData = hasAus || count > 0;
    const heat = getHeatLevel(ausPct, threshold);

    const ariaLabel = [
        `${copy("Día", "Day")} ${dayNumber}`,
        holidayLabel ? `${copy("Festivo", "Holiday")}: ${holiday(holidayLabel)}` : null,
        count > 0 ? `${count} ${count === 1 ? copy("incidencia", "incident") : copy("incidencias", "incidents")}` : copy("Sin incidencias", "No incidents"),
        hasAus ? `${copy("Ausentismo", "Absenteeism")}: ${ausPct!.toFixed(1)}%` : null,
        !hasData ? copy("Sin información", "No information") : null,
    ]
        .filter(Boolean)
        .join(", ");

    const cellClass = [
        "reporte-cal__cell",
        active ? "reporte-cal__cell--active" : "",
        !hasData ? "reporte-cal__cell--empty" : "",
        !active && heat !== "none" ? `reporte-cal__cell--${heat}` : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            role="button"
            tabIndex={hasData ? 0 : -1}
            aria-label={ariaLabel}
            aria-pressed={active}
            aria-selected={active}
            aria-disabled={!hasData}
            className={cellClass}
            onClick={() => {
                if (hasData) onSelectDay(day);
            }}
            onKeyDown={(e) => {
                if (!hasData) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectDay(day);
                }
            }}
        >
            <div className="reporte-cal__top">
                <div className="reporte-cal__kpi">
                    <span className="reporte-cal__daynum">{dayNumber}</span>
                </div>
                <div className="reporte-cal__kpi reporte-cal__kpi--right">
                    <span className="sr-only">{copy("Incidencias", "Incidents")}:</span>
                    {count > 0 ? (
                        <span className="reporte-cal__count">{count}</span>
                    ) : (
                        <span aria-hidden="true" className="reporte-cal__empty-dash">—</span>
                    )}
                </div>
            </div>

            {holidayLabel && (
                <span title={holiday(holidayLabel)} className="reporte-cal__holiday">
                    {holiday(holidayLabel)}
                </span>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReporteCalendar({
    calendarCells,
    daySummaries,
    dayAusentismoPct,
    selectedDay,
    selectedMonthHolidayLabels,
    currentMonth,
    ausentismoThreshold = AUSENTISMO_THRESHOLD,
    onSelectDay,
}: ReporteCalendarProps) {
    const { copy } = useReportLocale();
    const monthPart = currentMonth.split("-")[1];

    return (
        <div
            role="grid"
            aria-label={copy("Calendario de reporte de asistencia", "Attendance report calendar")}
            className="reporte-cal"
        >
            <WeekDayHeaders />

            <div className="reporte-cal__grid">
                {calendarCells.map((day, idx) => {
                    if (!day) {
                        return (
                            <div
                                key={`empty-${idx}`}
                                role="gridcell"
                                aria-hidden="true"
                                className="reporte-cal__spacer"
                            />
                        );
                    }

                    const count = daySummaries[day] ?? 0;
                    const ausPct = dayAusentismoPct[day];
                    const active = day === selectedDay;
                    const holidayLabel = selectedMonthHolidayLabels[`${monthPart}-${day}`];

                    return (
                        <DayCell
                            key={day}
                            day={day}
                            count={count}
                            ausPct={ausPct}
                            active={active}
                            holidayLabel={holidayLabel}
                            threshold={ausentismoThreshold}
                            onSelectDay={onSelectDay}
                        />
                    );
                })}
            </div>
        </div>
    );
}
