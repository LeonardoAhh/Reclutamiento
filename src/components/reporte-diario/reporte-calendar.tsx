import { cn } from "@/lib/utils-shadcn";
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

// ─── Token-driven style maps ─────────────────────────────────────────────────

const STYLES = {
    calendar: {
        width: "100%",
        maxWidth: "1000px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "var(--spacing-xs)",
    },
    weekdayHeader: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "var(--spacing-xs)",
        marginBottom: "var(--spacing-sm)",
    },
    weekdayCell: {
        padding: "var(--spacing-sm) 0",
        textAlign: "center" as const,
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        color: "var(--color-muted)",
        userSelect: "none" as const,
    },
    dayCell: {
        base: {
            position: "relative" as const,
            display: "flex",
            flexDirection: "column" as const,
            borderRadius: "var(--rounded-md)",
            border: "1px solid var(--color-hairline)",
            padding: "var(--spacing-sm)",
            textAlign: "left" as const,
            minHeight: "72px",
            transition: "all var(--transition-fast)",
            gap: "var(--spacing-xs)",
        },
        active: {
            background: "var(--color-primary)",
            color: "var(--color-on-primary)",
            borderColor: "var(--color-primary)",
        },
        inactive: {
            background: "var(--color-surface-card)",
            color: "var(--color-ink)",
            borderColor: "var(--color-hairline)",
        },
        empty: {
            background: "var(--color-surface-soft)",
            opacity: 0.5,
            cursor: "not-allowed" as const,
        },
    },
    dayNumber: {
        fontFamily: "var(--font-display)",
        fontWeight: "var(--type-heading-sm-weight)",
        fontSize: "var(--type-heading-sm-size)",
        lineHeight: "var(--type-heading-sm-line)",
    },
    holidayBadge: {
        marginTop: "var(--spacing-xs)",
        borderRadius: "var(--rounded-sm)",
        padding: "var(--spacing-xxs) var(--spacing-xs)",
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        whiteSpace: "nowrap" as const,
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    topRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    ausBadge: {
        base: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--rounded-md)",
            fontSize: "var(--type-caption-sm-size)",
            fontWeight: "var(--type-body-strong-weight)",
            padding: "var(--spacing-xxs) var(--spacing-xs)",
            lineHeight: "var(--type-caption-sm-line)",
        },
    },

    incidentBadge: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--rounded-md)",
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        padding: "0 var(--spacing-xs)",
        lineHeight: "1",
        minWidth: "20px",
        height: "20px",
    },
    emptyIndicator: {
        fontSize: "var(--type-caption-sm-size)",
        color: "var(--color-muted)",
        opacity: 0.5,
    },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAusentismoColors(ausPct: number, threshold: number, active: boolean) {
    if (active) return { background: "var(--color-surface-soft)", color: "var(--color-ink)" };
    if (ausPct > threshold * 2) return { background: "var(--color-error-tint)", color: "var(--color-error)" };
    if (ausPct > threshold) return { background: "var(--color-warning-tint)", color: "var(--color-warning)" };
    return { background: "var(--color-success-tint)", color: "var(--color-success)" };
}

function getCellHeatColors(ausPct: number | undefined, threshold: number, active: boolean) {
    if (active || ausPct === undefined) return {};
    if (ausPct > threshold * 2) return { border: "1px solid var(--color-error)" };
    if (ausPct > threshold) return { border: "1px solid var(--color-warning)" };
    return { border: "1px solid var(--color-success)" };
}

// ─── Subcomponent: Weekday Headers ─────────────────────────────────────────────

function WeekDayHeaders() {
    return (
        <div style={STYLES.weekdayHeader} role="row">
            {WEEK_DAY_NAMES.map((name) => (
                <div
                    key={name}
                    role="columnheader"
                    aria-label={name}
                    style={STYLES.weekdayCell}
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

    const ariaLabel = [
        `Día ${dayNumber}`,
        holidayLabel ? `Festivo: ${holidayLabel}` : null,
        count > 0 ? `${count} incidencia${count !== 1 ? "s" : ""}` : "Sin incidencias",
        hasAus ? `Ausentismo: ${ausPct!.toFixed(1)}%` : null,
        !hasData ? "Sin información" : null,
    ]
        .filter(Boolean)
        .join(", ");

    const heatColors = getCellHeatColors(ausPct, threshold, active);
    const ausColors = hasAus ? getAusentismoColors(ausPct, threshold, active) : { background: "", color: "" };

    const cellStyle = {
        ...STYLES.dayCell.base,
        ...(active ? STYLES.dayCell.active : STYLES.dayCell.inactive),
        ...(!hasData ? STYLES.dayCell.empty : {}),
        ...heatColors,
        cursor: hasData ? ("pointer" as const) : ("not-allowed" as const),
    };

    const holidayBadgeStyle = {
        ...STYLES.holidayBadge,
        background: active ? "var(--color-surface-soft)" : "var(--color-success-tint)",
        color: active ? "var(--color-ink)" : "var(--color-success)",
        border: `1px solid ${active ? "var(--color-hairline)" : "var(--color-success)"}`,
    };

    const incidentBadgeStyle = {
        ...STYLES.incidentBadge,
        background: active ? "var(--color-surface-soft)" : "var(--color-error-tint)",
        color: active ? "var(--color-ink)" : "var(--color-error)",
    };



    return (
        <div
            role="button"
            tabIndex={hasData ? 0 : -1}
            aria-label={ariaLabel}
            aria-pressed={active}
            aria-selected={active}
            aria-disabled={!hasData}
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
            style={cellStyle}
        >
            <div style={STYLES.topRow}>
                {/* Day number */}
                <span style={STYLES.dayNumber}>{dayNumber}</span>

                {/* Incident badge */}
                {count > 0 ? (
                    <span style={incidentBadgeStyle}>{count}</span>
                ) : (
                    <span aria-hidden="true" style={STYLES.emptyIndicator}>
                        —
                    </span>
                )}
            </div>

            {/* Holiday badge */}
            {holidayLabel && (
                <span title={holidayLabel} style={holidayBadgeStyle}>
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
            style={STYLES.calendar}
        >
            <WeekDayHeaders />

            <div style={STYLES.grid}>
                {calendarCells.map((day, idx) => {
                    if (!day) {
                        return (
                            <div
                                key={`empty-${idx}`}
                                role="gridcell"
                                aria-hidden="true"
                                style={{
                                    minHeight: "var(--spacing-xxl)",
                                }}
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
