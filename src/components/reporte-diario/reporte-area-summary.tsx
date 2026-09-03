import { useMemo, useState } from "react";
import { ChartPie } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide';
import type { AreaDetailRow, AreaStaffSummary } from "./types";
import { INCIDENCIA_LABELS } from "./constants";
import { PLANTILLA_AUTORIZADA } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { SectionSummaryCard} from "@/components/ui/SectionSummaryCard";

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

type StatusTone = "muted" | "error" | "warning" | "primary";

function getStatusTone(pct: number, hasIncidents: boolean): StatusTone {
    if (!hasIncidents) return "muted";
    if (pct > STATUS_THRESHOLDS.critical) return "error";
    if (pct > STATUS_THRESHOLDS.warning) return "warning";
    return "primary";
}

// ─── AreaCard Helper (Legacy data parsing for SectionSummaryCard) ────────────

function getAreaCardProps(area: AreaStaffSummary) {
    const active = area.operadores_autorizados > 0 ? area.operadores_contratados : area.personal_activo;
    const incidence = area.operadores_autorizados > 0 ? area.operadores_incidencia : area.personal_incidencia;
    const pct = active > 0 ? (incidence / active) * 100 : 0;

    const isDescanso = area.is_descanso;
    const isCriticalTrend = pct > TREND_THRESHOLD;
    const isClickable = incidence > 0;
    const statusTone = getStatusTone(pct, incidence > 0);
    const asistenciaValue = isDescanso ? "Descanso" : Math.max(active - incidence, 0);

    const opTitle = area.operadores_autorizados > 0 ? "OP. DE MÁQUINA" : undefined;
    const autorizado = area.operadores_autorizados > 0 ? area.operadores_autorizados : area.personal_autorizado;
    const contratados = area.operadores_autorizados > 0 ? area.operadores_contratados : area.personal_activo;

    // Solo mostramos el porcentaje de tendencia en áreas de Producción (Op. de Máquina)
    // EXCEPTO para Starlite, ya que no aplica la misma regla visual de tendencia.
    const isStarlite = area.area.includes("(STARLITE)");
    const showTrend = area.operadores_autorizados > 0 && !isStarlite;

    let displayName = area.area;
    if (displayName.includes("(STARLITE)")) {
        displayName = "STARLITE";
    }

    return {
        name: displayName,
        autorizado,
        contratados,
        asistencia: asistenciaValue,
        incidence,
        pct: showTrend ? pct : 0,
        showTrend,
        isDescanso,
        isCriticalTrend: showTrend ? isCriticalTrend : false,
        isClickable,
        statusTone,
    };
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
        <div className="reporte-incidents__empty reporte-incidents__empty--padded">
            <p>No hay ausencias registradas.</p>
        </div>
    );

    return (
        <div className="reporte-incidents__detail-list">
            {/* Desktop: tabla */}
            <div className="reporte-incidents__table-wrap">
                <table className="reporte-incidents__table">
                    <thead>
                        <tr>
                            <th scope="col">Empleado</th>
                            <th scope="col">Puesto</th>
                            <th scope="col">Turno</th>
                            <th scope="col">Incidencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            // En México, la "categoría" suele ser la letra final (A, B, C...)
                            const puestoLimpio = row.puesto
                                ? row.puesto.replace(/\s+[A-Z]$/i, '').trim()
                                : "-";
                            return (
                                <tr key={row.key}>
                                    <td className="reporte-incidents__td-num">
                                        <Tooltip content={row.nombre || 'Sin nombre'} side="right">
                                            <span>
                                                {row.numero_empleado}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td>{puestoLimpio}</td>
                                    <td><span className="reporte-chip">{row.turno}</span></td>
                                    <td><IncidenceBadge code={row.tipo_incidencia} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile: cards colapsables */}
            <ul className="reporte-incidents__cards" aria-label="Detalle de ausencias por empleado">
                {rows.map((row) => {
                    const isOpen = expanded.has(row.key);
                    const detailId = `area-detail-${row.key}`;
                    const puestoLimpio = row.puesto
                        ? row.puesto.replace(/\s+[A-Z]$/i, '').trim()
                        : "-";
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
                                <MorphingIcon
                                    icon={isOpen ? ChevronDown : ChevronRight}
                                    size={18}
                                    className="reporte-incidents__chevron"
                                    aria-hidden="true"
                                />
                            </button>

                            {isOpen && (
                                <div id={detailId} className="reporte-incidents__card-detail">
                                    <span className="reporte-incidents__detail-label">Empleado</span>
                                    <span className="reporte-incidents__detail-value">{row.numero_empleado}</span>
                                    {row.puesto && (
                                        <>
                                            <span className="reporte-incidents__detail-label">Puesto</span>
                                            <span className="reporte-incidents__detail-value">{puestoLimpio}</span>
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
            // Removemos sufijos como (STARLITE) para encontrar el área padre correcta en el mapa
            const normalizedSecArea = sec.area.replace(/\s*\([^)]*\)\s*$/i, '').trim();
            const parent = sectionAreaMap.get(normalizedSecArea) ?? sec.area;

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
                                <SectionSummaryCard
                                    key={sec.area}
                                    {...getAreaCardProps(sec)}
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
                                <SectionSummaryCard
                                    key={sec.area}
                                    {...getAreaCardProps(sec)}
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
                title={selectedArea || 'Detalle de sección'}
                size="lg"
            >
                <DetailList rows={detailRows} />
            </Modal>
        </section>
    );
}
