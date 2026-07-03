import { useMemo, useState } from "react";
import { Users, TrendingDown, TrendingUp, Filter, ChevronRight, Moon } from "lucide-react";
import type { AreaDetailRow, AreaStaffSummary } from "./types";
import { INCIDENCIA_LABELS } from "./constants";
import { PLANTILLA_AUTORIZADA } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteAreaSummaryProps {
    areas: AreaStaffSummary[];
    selectedArea: string | null;
    onSelectArea: (area: string | null) => void;
    detailRows: AreaDetailRow[];
}

interface AreaGroup {
    area: string;
    sections: AreaStaffSummary[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_THRESHOLDS = { critical: 15, warning: 5 } as const;
const TREND_THRESHOLD = 10;

interface StatusColors { background: string; text: string }

function getStatusColors(pct: number, hasIncidents: boolean): StatusColors {
    if (!hasIncidents) return {
        background: "transparent",
        text: "var(--color-muted)",
    };
    if (pct > STATUS_THRESHOLDS.critical) return {
        background: "transparent",
        text: "var(--color-error)",
    };
    if (pct > STATUS_THRESHOLDS.warning) return {
        background: "transparent",
        text: "var(--color-warning)",
    };
    return {
        background: "transparent",
        text: "var(--color-primary)",
    };
}

// ─── AreaCard ──────────────────────────────────────────────────────────────────

interface AreaCardProps {
    area: AreaStaffSummary;
    isSelected: boolean;
    onClick: () => void;
}

function AreaCard({ area, isSelected, onClick }: AreaCardProps) {
    const active = area.operadores_autorizados > 0 ? area.operadores_contratados : area.personal_activo;
    const incidence = area.operadores_autorizados > 0 ? area.operadores_incidencia : area.personal_incidencia;
    
    const pct = active > 0 ? (incidence / active) * 100 : 0;
    
    // El badge de la derecha sigue siendo el total de incidencias del área o solo operadores?
    // Mostramos solo de operadores si hay operadores.
    const status = getStatusColors(pct, incidence > 0);
    
    const asistenciaValue = area.is_descanso ? "—" : Math.max(active - incidence, 0);
    const trendColor = pct > TREND_THRESHOLD ? "var(--color-error)" : "var(--color-muted)";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`ras-card${isSelected ? " ras-card--selected" : ""}`}
            aria-pressed={isSelected}
            aria-label={`Sección ${area.area}. Autorizado: ${area.operadores_autorizados > 0 ? area.operadores_autorizados : area.personal_autorizado}`}
            data-testid={`area-card-${area.area.replace(/\s+/g, "-").toLowerCase()}`}
        >
            {/* Header: nombre + badge de incidencias o descanso */}
            <div className="ras-card__header">
                <span className="ras-card__name" title={area.area}>
                    {area.area}
                </span>
                
                <div className="ras-card__header-metrics">
                    {incidence > 0 && (
                        <span className="ras-card__trend" style={{ color: trendColor }} aria-label={`${pct.toFixed(0)}% ausentismo`}>
                            {pct > TREND_THRESHOLD
                                ? <TrendingUp size={12} aria-hidden="true" />
                                : <TrendingDown size={12} style={{ color: "var(--color-success)" }} aria-hidden="true" />}
                            {pct.toFixed(0)}%
                        </span>
                    )}
                    
                    {area.is_descanso ? (
                        <div className="ras-card__descanso" data-testid={`area-descanso-${area.area}`}>
                            <Moon size={11} aria-hidden="true" />
                            <span>Descanso</span>
                        </div>
                    ) : (
                        <span
                            className="ras-card__badge"
                            style={{ background: status.background, color: status.text }}
                            aria-label={`${incidence} incidencias`}
                        >
                            {incidence}
                        </span>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <footer className="ras-card__footer">
                <div className="ras-card__kpis-group">
                    {area.operadores_autorizados > 0 ? (
                        <>
                            <div className="ras-card__op-title">OP. DE MÁQUINA</div>
                            <dl className="ras-card__kpis">
                                <div className="ras-card__kpi">
                                    <dt>Autorizado</dt>
                                    <dd>{area.operadores_autorizados}</dd>
                                </div>
                                <div className="ras-card__kpi">
                                    <dt>Contratados</dt>
                                    <dd>{area.operadores_contratados}</dd>
                                </div>
                                <div className="ras-card__kpi">
                                    <dt>Asistencia</dt>
                                    <dd>{asistenciaValue}</dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        <dl className="ras-card__kpis">
                            <div className="ras-card__kpi">
                                <dt>Autorizado</dt>
                                <dd>{area.personal_autorizado}</dd>
                            </div>
                            <div className="ras-card__kpi">
                                <dt>Contratados</dt>
                                <dd>{area.personal_activo}</dd>
                            </div>
                            <div className="ras-card__kpi">
                                <dt>Asistencia</dt>
                                <dd>{asistenciaValue}</dd>
                            </div>
                        </dl>
                    )}
                </div>
            </footer>
        </button>
    );
}

// ─── IncidenceBadge ────────────────────────────────────────────────────────────

const INC_TONE: Record<string, "error" | "warn" | "info"> = {
    F: "error", S: "error", I: "error",
    FJ: "warn", P: "warn", PH: "warn", CT: "warn", TXT: "warn",
    V: "info",
};

function IncidenceBadge({ code }: { code: string }) {
    const tone = INC_TONE[code] ?? "warn";
    return <span className={`reporte-inc-badge reporte-inc-badge--${tone}`}>{INCIDENCIA_LABELS[code] ?? code}</span>;
}

// ─── DetailList ────────────────────────────────────────────────────────────────

function DetailList({ rows }: { rows: AreaDetailRow[] }) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (key: string) => setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });

    if (rows.length === 0) return (
        <div className="reporte-incidents__empty" style={{ padding: "var(--spacing-lg)" }}>
            <p>No hay ausencias registradas para esta sección.</p>
        </div>
    );

    return (
        <div style={{ padding: "var(--spacing-lg)" }}>
            {/* Desktop: tabla */}
            <div className="reporte-incidents__table-wrap">
                <table className="reporte-incidents__table">
                    <thead>
                        <tr>
                            <th scope="col"># Emp</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Incidencia</th>
                            <th scope="col">Turno</th>
                            <th scope="col">Depto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <td className="reporte-incidents__td-num">{row.numero_empleado}</td>
                                <td className="reporte-incidents__td-name">{row.nombre}</td>
                                <td><IncidenceBadge code={row.tipo_incidencia} /></td>
                                <td><span className="reporte-chip">{row.turno}</span></td>
                                <td>{row.departamento}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: cards colapsables */}
            <ul className="reporte-incidents__cards" aria-label="Detalle de ausencias por empleado">
                {rows.map((row) => {
                    const isOpen = expanded.has(row.key);
                    const detailId = `area-detail-${row.key}`;
                    return (
                        <li key={row.key} className="reporte-incidents__card">
                            <button
                                type="button"
                                className="reporte-incidents__card-summary"
                                aria-expanded={isOpen}
                                aria-controls={detailId}
                                onClick={() => toggle(row.key)}
                                data-testid={`area-detail-card-${row.key}`}
                            >
                                <span className="reporte-incidents__card-main">
                                    <span className="reporte-incidents__card-name">{row.nombre}</span>
                                    <span className="reporte-incidents__card-tags">
                                        <IncidenceBadge code={row.tipo_incidencia} />
                                    </span>
                                </span>
                                <span className="reporte-chip">T{row.turno}</span>
                                <ChevronRight size={18} className="reporte-incidents__chevron" aria-hidden="true" />
                            </button>

                            {isOpen && (
                                <div id={detailId} className="reporte-incidents__card-detail">
                                    <span className="reporte-incidents__detail-label"># Empleado</span>
                                    <span className="reporte-incidents__detail-value">{row.numero_empleado}</span>
                                    <span className="reporte-incidents__detail-label">Departamento</span>
                                    <span className="reporte-incidents__detail-value">{row.departamento}</span>
                                    {row.puesto && (
                                        <>
                                            <span className="reporte-incidents__detail-label">Puesto</span>
                                            <span className="reporte-incidents__detail-value">{row.puesto}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteAreaSummary({
    areas,
    selectedArea,
    onSelectArea,
    detailRows,
}: ReporteAreaSummaryProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Mapa seccion → área padre derivado de PLANTILLA_AUTORIZADA
    const sectionAreaMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const pos of PLANTILLA_AUTORIZADA) {
            map.set(pos.seccion, pos.area);
        }
        return map;
    }, []);

    // Agrupa las secciones por su área padre y ordena internamente.
    // Los grupos con 1 sola sección se fusionan en "OTRAS ÁREAS" para
    // evitar filas de grid con espacios vacíos.
    const { mainGroups, otrasAreas } = useMemo(() => {
        const groups = new Map<string, AreaStaffSummary[]>();
        for (const sec of areas) {
            const parent = sectionAreaMap.get(sec.area) ?? sec.area;
            if (!groups.has(parent)) groups.set(parent, []);
            groups.get(parent)!.push(sec);
        }

        const sorted = Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b, "es", { sensitivity: "base" }))
            .map(([area, sections]) => ({
                area,
                sections: sections.sort((a, b) =>
                    a.area.localeCompare(b.area, "es", { sensitivity: "base" })
                ),
            }));

        const main: AreaGroup[] = [];
        const singles: AreaStaffSummary[] = [];

        for (const g of sorted) {
            if (g.sections.length > 1) main.push(g);
            else singles.push(...g.sections);
        }

        return {
            mainGroups: main,
            otrasAreas: singles.sort((a, b) =>
                a.area.localeCompare(b.area, "es", { sensitivity: "base" })
            ),
        };
    }, [areas, sectionAreaMap]);

    const handleSelectArea = (area: string) => {
        if (selectedArea === area) {
            onSelectArea(null);
        } else {
            onSelectArea(area);
            setIsDetailOpen(true);
        }
    };

    if (areas.length === 0) return null;

    const totalIncidencias = areas.reduce((n, a) => n + (a.operadores_autorizados > 0 ? a.operadores_incidencia : a.personal_incidencia), 0);

    return (
        <section className="ras" aria-labelledby="ras-heading">

            {/* Encabezado */}
            <div className="ras__header">
                <div className="ras__header-title">
                    {totalIncidencias > 0 && (
                        <span className="ras__incidents-total" aria-label={`${totalIncidencias} incidencias`}>
                            {totalIncidencias} {totalIncidencias === 1 ? 'incidencia' : 'incidencias'}
                        </span>
                    )}
                </div>

                <div className="ras__header-actions">
                    {selectedArea && (
                        <button
                            type="button"
                            onClick={() => onSelectArea(null)}
                            className="ras__clear-btn"
                            aria-label="Limpiar filtro de sección"
                            data-testid="clear-area-filter"
                        >
                            <Filter size={13} aria-hidden="true" />
                            Limpiar filtro
                        </button>
                    )}
                </div>
            </div>

            {/* Grid agrupado por área */}
            <div className="ras__groups" role="list" aria-label="Secciones de la plantilla">
                {/* Grupos con varias secciones */}
                {mainGroups.map(({ area, sections }) => (
                    <div key={area} className="ras__group" role="listitem">
                        <h3 className="ras__group-label">
                            <span>{area}</span>
                            <span className="ras__group-count" aria-label={`${sections.length} secciones`}>
                                {sections.length}
                            </span>
                        </h3>
                        <div className="ras__grid" role="group" aria-label={`Secciones de ${area}`}>
                            {sections.map((sec) => (
                                <AreaCard
                                    key={sec.area}
                                    area={sec}
                                    isSelected={selectedArea === sec.area}
                                    onClick={() => handleSelectArea(sec.area)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Grupos de 1 sección → fusionados en "Otras Áreas" */}
                {otrasAreas.length > 0 && (
                    <div className="ras__group" role="listitem">
                        <h3 className="ras__group-label">
                            <span>Otras Áreas</span>
                            <span className="ras__group-count" aria-label={`${otrasAreas.length} secciones`}>
                                {otrasAreas.length}
                            </span>
                        </h3>
                        <div className="ras__grid" role="group" aria-label="Otras áreas de la plantilla">
                            {otrasAreas.map((sec) => (
                                <AreaCard
                                    key={sec.area}
                                    area={sec}
                                    isSelected={selectedArea === sec.area}
                                    onClick={() => handleSelectArea(sec.area)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalle de ausencias */}
            <Modal
                isOpen={isDetailOpen && selectedArea !== null}
                onClose={() => {
                    setIsDetailOpen(false);
                    onSelectArea(null);
                }}
                title={`Detalle de ausencias: ${selectedArea}`}
                subtitle={`${detailRows.length} colaborador${detailRows.length !== 1 ? "es" : ""} ausente${detailRows.length !== 1 ? "s" : ""} en esta sección.`}
                size="xl"
                fullscreenMobile={true}
            >
                <DetailList rows={detailRows} />
            </Modal>
        </section>
    );
}
