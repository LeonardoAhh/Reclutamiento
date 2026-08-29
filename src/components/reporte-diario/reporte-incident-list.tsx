import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import type { EmployeeRef } from "./types";

const TABLE_HEADERS = ["# Empleado", "Empleado", "Área", "Puesto", "Turno"] as const;

export function DataTable({ rows }: { rows: EmployeeRef[] }) {
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
                            <td className="reporte-incidents__td-num">{row.numero_empleado}</td>
                            <td className="reporte-incidents__td-name">{row.nombre}</td>
                            <td>{row.area}</td>
                            <td>{row.puesto || "-"}</td>
                            <td><span className="reporte-chip">{row.turno}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function MobileCards({ rows }: { rows: EmployeeRef[] }) {
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
                            <MorphingIcon
                                icon={isOpen ? ChevronDown : ChevronRight}
                                size={18}
                                className="reporte-incidents__chevron"
                                aria-hidden="true"
                            />
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

export function EmptyState() {
    return (
        <div className="reporte-incidents__empty">
            <CircleAlert size={24} aria-hidden="true" />
            <p>Sin registros para este criterio.</p>
        </div>
    );
}
