import { EyeOff } from 'lucide-react';
import { INCIDENT_TABS } from "./constants";
import type { IncidentTab, EmployeeRef } from "./types";
import { useReportLocale } from "./useReportLocale";

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
    const { incident } = useReportLocale();
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
            {incident(code)}
            <span className={badgeClass}>{count}</span>
        </button>
    );
}

import { DataTable, MobileCards, EmptyState } from "./reporte-incident-list";

export default function ReporteIncidentTabs({
    selectedTab,
    onSelectTab,
    dayCounts,
    incidentSummary,
}: ReporteIncidentTabsProps) {
    const { copy, incident } = useReportLocale();
    const visibleTabs = INCIDENT_TABS.filter((code) => (dayCounts[code] ?? 0) > 0);

    if (visibleTabs.length === 0) return null;

    const rows = selectedTab !== "" ? incidentSummary[selectedTab] : [];

    return (
        <div className="reporte-incidents">
            <div role="tablist" aria-label={copy("Tipos de incidencia", "Incident types")} className="reporte-incidents__tablist">
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
                        <EyeOff size={14} aria-hidden="true" />
                        {copy("Ocultar", "Hide")}
                    </button>
                )}
            </div>

            {selectedTab !== "" && (
                <div role="tabpanel" aria-label={`${copy("Detalle de", "Details for")} ${incident(selectedTab)}`}>
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
