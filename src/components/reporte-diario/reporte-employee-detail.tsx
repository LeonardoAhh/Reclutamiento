import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils-shadcn";
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

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
    },
    employeeId: {
        fontFamily: "var(--font-code)",
        fontSize: "var(--type-caption-sm-size)",
        lineHeight: "var(--type-caption-sm-line)",
        color: "var(--color-muted)",
    },
    subtitle: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: "var(--spacing-xs)",
        marginTop: "var(--spacing-xs)",
        fontSize: "var(--type-caption-sm-size)",
        lineHeight: "var(--type-caption-sm-line)",
        color: "var(--color-muted)",
    },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--spacing-sm)",
        marginTop: "var(--spacing-sm)",
    },
    kpiCard: {
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        background: "var(--color-surface-soft)",
        padding: "var(--spacing-sm)",
        textAlign: "center" as const,
    },
    kpiLabel: {
        fontSize: "var(--type-caption-sm-size)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
        margin: 0,
    },
    kpiValue: {
        fontSize: "var(--type-heading-sm-size)",
        fontWeight: "var(--type-heading-sm-weight)",
        lineHeight: "var(--type-heading-sm-line)",
        letterSpacing: "var(--type-heading-sm-tracking)",
        margin: 0,
    },
    calendarSection: {
        marginTop: "var(--spacing-lg)",
    },
    calendarLabel: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        color: "var(--color-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        lineHeight: "var(--type-caption-sm-line)",
        marginBottom: "var(--spacing-sm)",
    },
    calendarGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "var(--spacing-xs)",
    },
    weekdayHeader: {
        textAlign: "center" as const,
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        textTransform: "uppercase" as const,
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
        padding: "var(--spacing-xs) 0",
    },
    dayCell: {
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        padding: "var(--spacing-xs)",
        textAlign: "center" as const,
        transition: "all var(--transition-fast)",
    },
    dayNumber: {
        fontSize: "var(--type-body-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-body-sm-line)",
        color: "var(--color-ink)",
    },
    dayCode: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        lineHeight: "var(--type-caption-sm-line)",
        marginTop: "var(--spacing-xxs)",
    },
    incidentSection: {
        marginTop: "var(--spacing-lg)",
    },
    incidentLabel: {
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        color: "var(--color-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        lineHeight: "var(--type-caption-sm-line)",
        marginBottom: "var(--spacing-sm)",
    },
    incidentTableWrapper: {
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
        overflow: "hidden",
    },
    table: {
        minWidth: "100%",
        fontSize: "var(--type-body-sm-size)",
        lineHeight: "var(--type-body-sm-line)",
        borderCollapse: "collapse" as const,
    },
    thead: {
        borderBottom: "1px solid var(--color-hairline)",
        background: "var(--color-surface-soft)",
    },
    th: {
        padding: "var(--spacing-sm) var(--spacing-md)",
        textAlign: "left" as const,
        fontSize: "var(--type-caption-sm-size)",
        fontWeight: "var(--type-body-strong-weight)",
        textTransform: "uppercase" as const,
        letterSpacing: "var(--type-caption-up-tracking)",
        color: "var(--color-muted)",
        lineHeight: "var(--type-caption-sm-line)",
    },
    tbody: {},
    tr: {
        borderBottom: "1px solid var(--color-hairline-soft)",
    },
    td: {
        base: {
            padding: "var(--spacing-sm) var(--spacing-md)",
        },
        day: {
            fontFamily: "var(--font-code)",
            fontSize: "var(--type-caption-sm-size)",
            lineHeight: "var(--type-caption-sm-line)",
        },
        type: {
            color: "var(--color-ink)",
        },
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "var(--spacing-lg)",
    },
} as const;

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
    if (code === "D" || code === "DF") return "rgba(var(--color-accent-teal-rgb), 0.1)";
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

// ─── Subcomponent: KPI Cards ───────────────────────────────────────────────────

interface KpiCardsProps {
    stats: EmployeeStats;
}

const KPI_CONFIG = [
    { label: "Asistencias", key: "asistencias" as const, tone: "var(--color-success)" },
    { label: "Incidencias", key: "incidencias" as const, tone: "var(--color-error)" },
    { label: "Descansos", key: "descansos" as const, tone: "var(--color-accent-teal)" },
] as const;

function KpiCards({ stats }: KpiCardsProps) {
    return (
        <div style={STYLES.kpiGrid}>
            {KPI_CONFIG.map(({ label, key, tone }) => {
                const value = stats[key];
                const valueColor = key === "incidencias" && value === 0
                    ? "var(--color-muted)"
                    : tone;

                return (
                    <div key={label} style={STYLES.kpiCard}>
                        <p style={STYLES.kpiLabel}>{label}</p>
                        <p style={{ ...STYLES.kpiValue, color: valueColor }}>{value}</p>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Subcomponent: Calendar Grid ───────────────────────────────────────────────

interface CalendarGridProps {
    employee: ReporteRow;
    dayHeaders: string[];
    year: number;
    month: number;
}

function CalendarGrid({ employee, dayHeaders, year, month }: CalendarGridProps) {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const emptyCells = Array.from({ length: firstDay }, (_, i) => (
        <div key={`empty-${i}`} />
    ));

    return (
        <div style={STYLES.calendarSection}>
            <p style={STYLES.calendarLabel}>Calendario del mes</p>
            <div style={STYLES.calendarGrid}>
                {DAY_NAMES.map((d) => (
                    <div key={d} style={STYLES.weekdayHeader}>
                        {d}
                    </div>
                ))}
                {emptyCells}
                {dayHeaders.map((day) => {
                    const code = employee.days[day] ?? "";
                    const label = INCIDENCIA_LABELS[code] ?? code;

                    return (
                        <div
                            key={day}
                            style={{
                                ...STYLES.dayCell,
                                background: codeBg(code),
                            }}
                            title={`Día ${parseInt(day, 10)}: ${label}`}
                        >
                            <span style={STYLES.dayNumber}>{parseInt(day, 10)}</span>
                            <p style={{ ...STYLES.dayCode, color: codeTone(code) }}>
                                {code || "—"}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Subcomponent: Incident Table ──────────────────────────────────────────────

interface IncidentTableProps {
    incidents: { day: string; code: string }[];
    year: number;
    month: number;
}

const TABLE_HEADERS = ["Día", "Código", "Tipo"] as const;

function IncidentTable({ incidents, year, month }: IncidentTableProps) {
    if (incidents.length === 0) return null;

    return (
        <div style={STYLES.incidentSection}>
            <p style={STYLES.incidentLabel}>
                Detalle de incidencias ({incidents.length})
            </p>
            <div style={STYLES.incidentTableWrapper}>
                <table style={STYLES.table}>
                    <thead style={STYLES.thead}>
                        <tr>
                            {TABLE_HEADERS.map((header) => (
                                <th key={header} scope="col" style={STYLES.th}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map(({ day, code }) => {
                            const dayNum = parseInt(day, 10);
                            const date = new Date(year, month - 1, dayNum);
                            const weekday = DAY_NAMES[date.getDay()];

                            return (
                                <tr key={day} style={STYLES.tr}>
                                    <td style={{ ...STYLES.td.base, ...STYLES.td.day }}>
                                        {weekday} {dayNum}
                                    </td>
                                    <td style={STYLES.td.base}>
                                        <Badge variant="error">{code}</Badge>
                                    </td>
                                    <td style={{ ...STYLES.td.base, ...STYLES.td.type }}>
                                        {INCIDENCIA_LABELS[code] ?? code}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
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
        [employee, dayHeaders]
    );

    useEffect(() => {
        if (open) {
            setActiveTab('overview');
        }
    }, [open]);

    if (!employee || !stats) return null;

    const [year, month] = currentMonth.split("-").map(Number);

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div style={STYLES.titleRow}>
                    <span style={STYLES.employeeId}>#{employee.numero_empleado}</span>
                    <span>{employee.nombre}</span>
                </div>
            }
            subtitle={
                <div style={STYLES.subtitle}>
                    {employee.puesto && <Badge>{employee.puesto}</Badge>}
                    {employee.departamento && <Badge>{employee.departamento}</Badge>}
                    {employee.area && <Badge>{employee.area}</Badge>}
                    {employee.turno && <Badge>Turno {employee.turno}</Badge>}
                </div>
            }
            size="lg"
            className="reporte-employee-detail-modal"
            fullscreenMobile={true}
        >
            <div className="modal-body">
                <div className="reporte-employee-detail__tabs" role="tablist" aria-label="Secciones del detalle de empleado">
                    <button
                        type="button"
                        role="tab"
                        id="emp-tab-overview"
                        aria-selected={activeTab === 'overview'}
                        aria-controls="emp-detail-panel"
                        tabIndex={activeTab === 'overview' ? 0 : -1}
                        className={`reporte-employee-detail__tab ${activeTab === 'overview' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Resumen
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="emp-tab-incidencias"
                        aria-selected={activeTab === 'incidencias'}
                        aria-controls="emp-detail-panel"
                        tabIndex={activeTab === 'incidencias' ? 0 : -1}
                        className={`reporte-employee-detail__tab ${activeTab === 'incidencias' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('incidencias')}
                    >
                        Incidencias
                    </button>
                </div>

                <div
                    className="reporte-employee-detail__panel"
                    id="emp-detail-panel"
                    role="tabpanel"
                    tabIndex={0}
                    aria-labelledby={activeTab === 'overview' ? 'emp-tab-overview' : 'emp-tab-incidencias'}
                >
                    {activeTab === 'overview' ? (
                        <>
                            <div className="reporte-employee-detail__meta-grid">
                                <div className="reporte-employee-detail__info-item">
                                    <span className="reporte-employee-detail__info-label">Departamento</span>
                                    <span>{employee.departamento || '—'}</span>
                                </div>
                                <div className="reporte-employee-detail__info-item">
                                    <span className="reporte-employee-detail__info-label">Área</span>
                                    <span>{employee.area || '—'}</span>
                                </div>
                                <div className="reporte-employee-detail__info-item">
                                    <span className="reporte-employee-detail__info-label">Puesto</span>
                                    <span>{employee.puesto || '—'}</span>
                                </div>
                                <div className="reporte-employee-detail__info-item">
                                    <span className="reporte-employee-detail__info-label">Turno</span>
                                    <span>{employee.turno || '—'}</span>
                                </div>
                            </div>
                            <KpiCards stats={stats} />
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
