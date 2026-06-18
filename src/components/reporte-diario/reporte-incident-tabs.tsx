import { cn } from "@/lib/utils-shadcn";
import { CircleAlert, X } from "lucide-react";
import { INCIDENT_TABS, INCIDENCIA_LABELS } from "./constants";
import type { IncidentTab, EmployeeRef } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteIncidentTabsProps {
    selectedTab: IncidentTab | "";
    onSelectTab: (tab: IncidentTab | "") => void;
    dayCounts: Record<IncidentTab, number>;
    incidentSummary: Record<IncidentTab, EmployeeRef[]>;
}

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
    container: {
        marginTop: "var(--spacing-xl)",
    },
    tablist: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: "var(--spacing-xs)",
        marginBottom: "var(--spacing-md)",
    },
    tab: {
        base: {
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--spacing-xs)",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            borderRadius: "var(--rounded-full)",
            border: "1px solid var(--color-hairline)",
            background: "var(--color-surface-card)",
            color: "var(--color-charcoal)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--type-body-sm-size)",
            fontWeight: "var(--type-body-strong-weight)",
            lineHeight: "var(--type-body-sm-line)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
        },
        active: {
            background: "var(--color-surface-soft)",
            color: "var(--color-ink)",
            borderColor: "var(--color-primary)",
        },
    },
    tabBadge: {
        base: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "var(--control-height)",
            height: "var(--control-height)",
            borderRadius: "var(--rounded-full)",
            padding: "0 var(--spacing-xs)",
            fontSize: "var(--type-caption-sm-size)",
            fontWeight: "var(--type-body-strong-weight)",
            lineHeight: "1",
        },
    },
    clearBtn: {
        marginLeft: "auto",
    },
    tableWrapper: {
        overflowX: "auto" as const,
        borderRadius: "var(--rounded-lg)",
        border: "1px solid var(--color-hairline)",
    },
    table: {
        minWidth: "100%",
        fontSize: "var(--type-body-sm-size)",
        lineHeight: "var(--type-body-sm-line)",
        borderCollapse: "collapse" as const,
    },
    thead: {
        background: "var(--color-surface-soft)",
        borderBottom: "1px solid var(--color-hairline)",
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
        whiteSpace: "nowrap" as const,
    },
    tbody: {
        background: "var(--color-surface-card)",
    },
    tr: {
        borderBottom: "1px solid var(--color-hairline-soft)",
        transition: "background var(--transition-fast)",
    },
    td: {
        base: {
            padding: "var(--spacing-sm) var(--spacing-md)",
            whiteSpace: "nowrap" as const,
        },
        name: {
            fontWeight: "var(--type-body-strong-weight)",
            color: "var(--color-ink)",
        },
        number: {
            color: "var(--color-muted)",
            fontFamily: "var(--font-code)",
            fontSize: "var(--type-caption-sm-size)",
        },
        dept: {
            color: "var(--color-ink)",
        },
        area: {
            color: "var(--color-ink)",
        },
        shift: {
            display: "inline-flex",
            borderRadius: "var(--rounded-full)",
            background: "var(--color-surface-soft)",
            padding: "var(--spacing-xxs) var(--spacing-sm)",
            fontSize: "var(--type-caption-sm-size)",
            fontWeight: "var(--type-body-strong-weight)",
            lineHeight: "var(--type-caption-sm-line)",
            color: "var(--color-muted)",
        },
    },
    emptyState: {
        wrapper: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--rounded-lg)",
            border: "1px dashed var(--color-hairline)",
            background: "var(--color-surface-soft)",
            padding: "var(--spacing-xl) var(--spacing-lg)",
            textAlign: "center" as const,
        },
        icon: {
            color: "var(--color-muted)",
            opacity: 0.3,
            marginBottom: "var(--spacing-sm)",
        },
        text: {
            fontSize: "var(--type-body-sm-size)",
            lineHeight: "var(--type-body-sm-line)",
            color: "var(--color-muted)",
            margin: 0,
        },
    },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTabBadgeStyle(active: boolean, count: number) {
    if (active) {
        return {
            ...STYLES.tabBadge.base,
            background: "var(--color-primary-tint, rgba(0,0,0,0.1))",
            color: "var(--color-primary)",
        };
    }
    if (count > 0) {
        return {
            ...STYLES.tabBadge.base,
            background: "var(--color-warning-tint)",
            color: "var(--color-warning)",
        };
    }
    return {
        ...STYLES.tabBadge.base,
        background: "var(--color-surface-soft)",
        color: "var(--color-muted)",
    };
}

// ─── Subcomponent: Tab Button ──────────────────────────────────────────────────

interface TabButtonProps {
    code: IncidentTab;
    count: number;
    active: boolean;
    onClick: () => void;
}

function TabButton({ code, count, active, onClick }: TabButtonProps) {
    const tabStyle = {
        ...STYLES.tab.base,
        ...(active ? STYLES.tab.active : {}),
    };

    const badgeStyle = getTabBadgeStyle(active, count);

    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            style={tabStyle}
        >
            {INCIDENCIA_LABELS[code] ?? code}
            <span style={badgeStyle}>{count}</span>
        </button>
    );
}

// ─── Subcomponent: Clear Button ────────────────────────────────────────────────

interface ClearButtonProps {
    onClick: () => void;
}

function ClearButton({ onClick }: ClearButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ ...STYLES.tab.base, ...STYLES.clearBtn }}
        >
            <X size={14} />
            Ocultar tabla
        </button>
    );
}

// ─── Subcomponent: Data Table ──────────────────────────────────────────────────

interface DataTableProps {
    rows: EmployeeRef[];
}

const TABLE_HEADERS = ["Empleado", "# Empleado", "Departamento", "Área", "Turno"] as const;

function DataTable({ rows }: DataTableProps) {
    return (
        <div style={STYLES.tableWrapper}>
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
                <tbody style={STYLES.tbody}>
                    {rows.map((row) => (
                        <tr key={row.key} style={STYLES.tr}>
                            <td style={{ ...STYLES.td.base, ...STYLES.td.name }}>
                                {row.nombre}
                            </td>
                            <td style={{ ...STYLES.td.base, ...STYLES.td.number }}>
                                {row.numero_empleado}
                            </td>
                            <td style={{ ...STYLES.td.base, ...STYLES.td.dept }}>
                                {row.departamento}
                            </td>
                            <td style={{ ...STYLES.td.base, ...STYLES.td.area }}>
                                {row.area}
                            </td>
                            <td style={STYLES.td.base}>
                                <span style={STYLES.td.shift}>{row.turno}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Subcomponent: Empty State ───────────────────────────────────────────────────

function EmptyState() {
    return (
        <div style={STYLES.emptyState.wrapper}>
            <CircleAlert size={24} style={STYLES.emptyState.icon} />
            <p style={STYLES.emptyState.text}>Sin registros para este criterio.</p>
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
    const visibleTabs = INCIDENT_TABS.filter(
        (code) => (dayCounts[code] ?? 0) > 0
    );

    return (
        <div style={STYLES.container}>
            <div role="tablist" style={STYLES.tablist}>
                {visibleTabs.map((code) => (
                    <TabButton
                        key={code}
                        code={code}
                        count={dayCounts[code] ?? 0}
                        active={selectedTab === code}
                        onClick={() => onSelectTab(code)}
                    />
                ))}

                {selectedTab !== "" && (
                    <ClearButton onClick={() => onSelectTab("")} />
                )}
            </div>

            {selectedTab !== "" && (
                <div role="tabpanel">
                    {(dayCounts[selectedTab] ?? 0) > 0 ? (
                        <DataTable rows={incidentSummary[selectedTab]} />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}
        </div>
    );
}
