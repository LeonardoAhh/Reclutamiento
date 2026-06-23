import { useState } from "react";

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
    return (
        <div className="reporte-cal__weekdays" role="row">
            {WEEK_DAY_NAMES.map((name) => (
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
    const hasAus = ausPct !== undefined;
    const dayNumber = parseInt(day, 10);
    const hasData = hasAus || count > 0;
    const heat = getHeatLevel(ausPct, threshold);

    const ariaLabel = [
        `Día ${dayNumber}`,
        holidayLabel ? `Festivo: ${holidayLabel}` : null,
        count > 0 ? `${count} incidencia${count !== 1 ? "s" : ""}` : "Sin incidencias",
        hasAus ? `Ausentismo: ${ausPct!.toFixed(1)}%` : null,
        !hasData ? "Sin información" : null,
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
                <span className="reporte-cal__daynum">{dayNumber}</span>
                {count > 0 ? (
                    <span className="reporte-cal__count">{count}</span>
                ) : (
                    <span aria-hidden="true" className="reporte-cal__empty-dash">—</span>
                )}
            </div>

            {holidayLabel && (
                <span title={holidayLabel} className="reporte-cal__holiday">
                    {holidayLabel}
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
    const monthPart = currentMonth.split("-")[1];

    return (
        <div
            role="grid"
            aria-label="Calendario de reporte de asistencia"
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
