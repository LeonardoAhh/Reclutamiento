import { useState } from "react";
import { CircleAlert, X, ChevronRight } from "lucide-react";
import { INCIDENT_TABS, INCIDENCIA_LABELS } from "./constants";
import type { IncidentTab, EmployeeRef } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteIncidentTabsProps {
    selectedTab: IncidentTab | "";
    onSelectTab: (tab: IncidentTab | "") => void;
    dayCounts: Record<IncidentTab, number>;
    incidentSummary: Record<IncidentTab, EmployeeRef[]>;
}

// ─── Subcomponent: Tab Button ──────────────────────────────────────────────────

interface TabButtonProps {
    code: IncidentTab;
    count: number;
    active: boolean;
    onClick: () => void;
}

function TabButton({ code, count, active, onClick }: TabButtonProps) {
    const badgeClass = active
        ? "reporte-incidents__tab-badge reporte-incidents__tab-badge--active"
        : count > 0
            ? "reporte-incidents__tab-badge reporte-incidents__tab-badge--count"
            : "reporte-incidents__tab-badge";

    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className="reporte-incidents__tab"
            data-testid={`incident-tab-${code}`}
        >
            {INCIDENCIA_LABELS[code] ?? code}
            <span className={badgeClass}>{count}</span>
        </button>
    );
}

// ─── Subcomponent: Desktop Table ───────────────────────────────────────────────

const TABLE_HEADERS = ["Empleado", "# Empleado", "Departamento", "Área", "Turno"] as const;

function DataTable({ rows }: { rows: EmployeeRef[] }) {
    return (
        <div className="reporte-incidents__table-wrap">
            <table className="reporte-incidents__table">
                <thead>
                    <tr>
                        {TABLE_HEADERS.map((header) => (
                            <th key={header} scope="col">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            <td className="reporte-incidents__td-name">{row.nombre}</td>
                            <td className="reporte-incidents__td-num">{row.numero_empleado}</td>
                            <td>{row.departamento}</td>
                            <td>{row.area}</td>
                            <td><span className="reporte-chip">{row.turno}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Subcomponent: Mobile Cards (inline expand) ────────────────────────────────

function MobileCards({ rows }: { rows: EmployeeRef[] }) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <ul className="reporte-incidents__cards" aria-label="Listado de incidencias">
            {rows.map((row) => {
                const isOpen = expanded.has(row.key);
                const detailId = `inc-detail-${row.key}`;
                return (
                    <li key={row.key} className="reporte-incidents__card">
                        <button
                            type="button"
                            className="reporte-incidents__card-summary"
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            onClick={() => toggle(row.key)}
                            data-testid={`incident-card-${row.key}`}
                        >
                            <span className="reporte-incidents__card-main">
                                <span className="reporte-incidents__card-name">{row.nombre}</span>
                                <span className="reporte-incidents__card-sub">{row.area}</span>
                            </span>
                            <span className="reporte-chip">{row.turno}</span>
                            <ChevronRight size={18} className="reporte-incidents__chevron" aria-hidden="true" />
                        </button>

                        {isOpen && (
                            <div id={detailId} className="reporte-incidents__card-detail">
                                <span className="reporte-incidents__detail-label"># Empleado</span>
                                <span className="reporte-incidents__detail-value">{row.numero_empleado}</span>
                                <span className="reporte-incidents__detail-label">Departamento</span>
                                <span className="reporte-incidents__detail-value">{row.departamento}</span>
                                <span className="reporte-incidents__detail-label">Área</span>
                                <span className="reporte-incidents__detail-value">{row.area}</span>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

// ─── Subcomponent: Empty State ───────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="reporte-incidents__empty">
            <CircleAlert size={24} aria-hidden="true" />
            <p>Sin registros para este criterio.</p>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteIncidentTabs({
    selectedTab,
    onSelectTab,
    dayCounts,
    incidentSummary,
}: ReporteIncidentTabsProps) {
    const visibleTabs = INCIDENT_TABS.filter((code) => (dayCounts[code] ?? 0) > 0);

    if (visibleTabs.length === 0) return null;

    const rows = selectedTab !== "" ? incidentSummary[selectedTab] : [];

    return (
        <div className="reporte-incidents">
            <div role="tablist" aria-label="Tipos de incidencia" className="reporte-incidents__tablist">
                {visibleTabs.map((code) => (
                    <TabButton
                        key={code}
                        code={code}
                        count={dayCounts[code] ?? 0}
                        active={selectedTab === code}
                        onClick={() => onSelectTab(selectedTab === code ? "" : code)}
                    />
                ))}

                {selectedTab !== "" && (
                    <button
                        type="button"
                        onClick={() => onSelectTab("")}
                        className="reporte-incidents__tab reporte-incidents__clear"
                        data-testid="incident-clear-btn"
                    >
                        <X size={14} aria-hidden="true" />
                        Ocultar
                    </button>
                )}
            </div>

            {selectedTab !== "" && (
                <div role="tabpanel" aria-label={`Detalle de ${INCIDENCIA_LABELS[selectedTab] ?? selectedTab}`}>
                    {rows.length > 0 ? (
                        <>
                            <DataTable rows={rows} />
                            <MobileCards rows={rows} />
                        </>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}
        </div>
    );
}
