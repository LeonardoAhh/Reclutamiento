"use client";

import { useEffect, useMemo, useState } from "react";
import { INCIDENCIA_LABELS } from "./constants";
import { isIncidence } from "./helpers";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { ReporteRow } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteEmployeeDetailProps {
    open: boolean;
    onClose: () => void;
    employee: ReporteRow | null;
    dayHeaders: string[];
    currentMonth: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function codeTone(code: string | undefined): string {
    if (!code || code === "-" || code === "X") return "var(--color-muted)";
    if (code === "A") return "var(--color-success)";
    if (code === "D" || code === "DF") return "var(--color-accent-teal)";
    return "var(--color-error)";
}

function codeBg(code: string | undefined): string {
    if (!code || code === "-" || code === "X") return "var(--color-surface-soft)";
    if (code === "A") return "var(--color-success-tint)";
    if (code === "D" || code === "DF") return "rgba(var(--color-accent-teal-rgb, 0 128 128), 0.08)";
    return "var(--color-error-tint)";
}

interface EmployeeStats {
    asistencias: number;
    incidencias: number;
    descansos: number;
    tracked: number;
    incidentDetail: { day: string; code: string }[];
}

function computeStats(employee: ReporteRow, dayHeaders: string[]): EmployeeStats {
    let asistencias = 0;
    let incidencias = 0;
    let descansos = 0;
    let tracked = 0;
    const incidentDetail: { day: string; code: string }[] = [];

    for (const day of dayHeaders) {
        const code = employee.days[day];
        if (!code || code === "-" || code === "X") continue;
        tracked++;
        if (code === "A") asistencias++;
        else if (code === "D" || code === "DF") descansos++;
        else if (isIncidence(code)) {
            incidencias++;
            incidentDetail.push({ day, code });
        }
    }

    return { asistencias, incidencias, descansos, tracked, incidentDetail };
}

// ─── KPI Cards ─────────────────────────────────────────────────────────────────

const KPI_CONFIG = [
    { label: "Asistencias", key: "asistencias" as const, tone: "var(--color-success)" },
    { label: "Incidencias", key: "incidencias" as const, tone: "var(--color-error)" },
    { label: "Descansos",   key: "descansos"   as const, tone: "var(--color-accent-teal)" },
] as const;

function KpiCards({ stats }: { stats: EmployeeStats }) {
    return (
        <div className="emp-kpi-grid" role="list" aria-label="Resumen de asistencia">
            {KPI_CONFIG.map(({ label, key, tone }) => {
                const value = stats[key];
                const color = key === "incidencias" && value === 0 ? "var(--color-muted)" : tone;
                return (
                    <div key={label} className="emp-kpi-card" role="listitem">
                        <span className="emp-kpi-value" style={{ color }}>{value}</span>
                        <span className="emp-kpi-label">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

interface CalendarGridProps {
    employee: ReporteRow;
    dayHeaders: string[];
    year: number;
    month: number;
}

function CalendarGrid({ employee, dayHeaders, year, month }: CalendarGridProps) {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const emptyCells = Array.from({ length: firstDay }, (_, i) => (
        <div key={`empty-${i}`} aria-hidden="true" />
    ));

    return (
        <section className="emp-calendar-section" aria-label="Calendario del mes">
            <p className="emp-section-label">Calendario del mes</p>
            <div className="emp-calendar-grid" role="grid">
                {DAY_NAMES.map((d) => (
                    <div key={d} className="emp-calendar-weekday" role="columnheader" aria-label={d}>
                        {d}
                    </div>
                ))}
                {emptyCells}
                {dayHeaders.map((day) => {
                    const code = employee.days[day] ?? "";
                    const label = INCIDENCIA_LABELS[code] ?? code;
                    const dayNum = parseInt(day, 10);

                    return (
                        <div
                            key={day}
                            className="emp-calendar-day"
                            style={{ background: codeBg(code) }}
                            title={`Día ${dayNum}: ${label || "Sin registro"}`}
                            role="gridcell"
                            aria-label={`Día ${dayNum}: ${label || "sin registro"}`}
                        >
                            <span className="emp-calendar-day__num">{dayNum}</span>
                            <span className="emp-calendar-day__code" style={{ color: codeTone(code) }}>
                                {code || "—"}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// ─── Incident Table ─────────────────────────────────────────────────────────────

interface IncidentTableProps {
    incidents: { day: string; code: string }[];
    year: number;
    month: number;
}

function IncidentTable({ incidents, year, month }: IncidentTableProps) {
    if (incidents.length === 0) {
        return (
            <div className="emp-empty-state" role="status">
                <span aria-hidden="true">✓</span>
                Sin incidencias registradas este mes
            </div>
        );
    }

    return (
        <section className="emp-incident-section" aria-label={`Detalle de incidencias, ${incidents.length} registros`}>
            <p className="emp-section-label">
                Detalle de incidencias
                <span className="emp-section-count">{incidents.length}</span>
            </p>
            <div className="emp-table-wrapper" role="region" aria-label="Tabla de incidencias">
                <table className="emp-table">
                    <thead>
                        <tr>
                            <th scope="col">Día</th>
                            <th scope="col">Código</th>
                            <th scope="col">Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map(({ day, code }) => {
                            const dayNum = parseInt(day, 10);
                            const date   = new Date(year, month - 1, dayNum);
                            const weekday = DAY_NAMES[date.getDay()];
                            const label   = INCIDENCIA_LABELS[code] ?? code;

                            return (
                                <tr key={day}>
                                    <td className="emp-table__td--day">
                                        <span className="emp-table__weekday">{weekday}</span>
                                        <span className="emp-table__daynum">{dayNum}</span>
                                    </td>
                                    <td>
                                        <span
                                            className="emp-code-chip"
                                            style={{
                                                color: codeTone(code),
                                                background: codeBg(code),
                                            }}
                                            aria-label={`Código ${code}`}
                                        >
                                            {code}
                                        </span>
                                    </td>
                                    <td className="emp-table__td--type">{label}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteEmployeeDetail({
    open,
    onClose,
    employee,
    dayHeaders,
    currentMonth,
}: ReporteEmployeeDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'incidencias'>('overview');
    const stats = useMemo(
        () => (employee ? computeStats(employee, dayHeaders) : null),
        [employee, dayHeaders],
    );

    useEffect(() => {
        if (open) setActiveTab('overview');
    }, [open]);

    if (!employee || !stats) return null;

    const [year, month] = currentMonth.split("-").map(Number);

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="emp-title-row">
                    <span className="emp-id" aria-label={`Número de empleado ${employee.numero_empleado}`}>
                        #{employee.numero_empleado}
                    </span>
                    <span className="emp-name">{employee.nombre}</span>
                </div>
            }
            subtitle={
                <div className="emp-meta-strip" aria-label="Información del empleado">
                    {employee.departamento && <span className="emp-meta-chip">{employee.departamento}</span>}
                    {employee.area        && <span className="emp-meta-chip">{employee.area}</span>}
                    {employee.puesto      && <span className="emp-meta-chip">{employee.puesto}</span>}
                    {employee.turno       && <span className="emp-meta-chip">Turno {employee.turno}</span>}
                </div>
            }
            size="lg"
            className="reporte-employee-detail-modal"
            fullscreenMobile={true}
        >
            <div className="modal-body">
                {/* Tab bar */}
                <div className="emp-tabs" role="tablist" aria-label="Secciones del detalle de empleado">
                    {(["overview", "incidencias"] as const).map((tab) => {
                        const labels = { overview: "Resumen", incidencias: "Incidencias" };
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                id={`emp-tab-${tab}`}
                                aria-selected={isActive}
                                aria-controls={`emp-panel-${tab}`}
                                className={`emp-tab ${isActive ? "emp-tab--active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {labels[tab]}
                                {tab === "incidencias" && stats.incidencias > 0 && (
                                    <span className="emp-tab-badge" aria-hidden="true">
                                        {stats.incidencias}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Panels */}
                <div
                    id={`emp-panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`emp-tab-${activeTab}`}
                    className="emp-panel"
                >
                    {activeTab === 'overview' ? (
                        <>
                            <KpiCards stats={stats} />
                            <CalendarGrid
                                employee={employee}
                                dayHeaders={dayHeaders}
                                year={year}
                                month={month}
                            />
                        </>
                    ) : (
                        <IncidentTable
                            incidents={stats.incidentDetail}
                            year={year}
                            month={month}
                        />
                    )}
                </div>
            </div>
        </Modal>
    );
}
