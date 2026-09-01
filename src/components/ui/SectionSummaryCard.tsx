import React from 'react';
import { Moon, TrendingDown, TrendingUp } from 'lucide-react';
import './SectionSummaryCard.css';

export type StatusTone = "muted" | "error" | "warning" | "primary";

export interface SectionSummaryCardProps {
    name: string;
    autorizado: number;
    contratados: number;
    asistencia: string | number;
    incidence: number;
    pct: number;
    
    isDescanso?: boolean;
    isCriticalTrend?: boolean;
    showTrend?: boolean;
    isSelected?: boolean;
    isClickable?: boolean;
    onClick?: () => void;
    
    opTitle?: string;
    
    statusTone?: StatusTone;
}

export function SectionSummaryCard({
    name,
    autorizado,
    contratados,
    asistencia,
    incidence,
    pct,
    isDescanso = false,
    isCriticalTrend = false,
    showTrend = true,
    isSelected = false,
    isClickable = false,
    onClick,
    opTitle,
    statusTone = "muted",
}: SectionSummaryCardProps) {

    let statusClass = "";
    if (isDescanso) {
        statusClass = " section-summary-card--descanso";
    } else if (incidence > 0) {
        statusClass = " section-summary-card--has-incidents";
    } else {
        statusClass = " section-summary-card--no-incidents";
    }

    const className = `section-summary-card${isSelected ? " section-summary-card--selected" : ""}${statusClass}`;

    const cardContent = (
        <>
            {/* Header: nombre + badge de incidencias o descanso */}
            <div className="section-summary-card__header">
                <span className="section-summary-card__name" title={name}>
                    {name}
                </span>

                <div className="section-summary-card__header-metrics">
                    {incidence > 0 && showTrend && (
                        <span className={`section-summary-card__trend section-summary-card__trend--${isCriticalTrend ? "critical" : "stable"}`} aria-label={`${pct.toFixed(0)}% ausentismo`}>
                            {isCriticalTrend
                                ? <TrendingUp size="1em" aria-hidden="true" />
                                : <TrendingDown size="1em" aria-hidden="true" />}
                            {pct.toFixed(0)}%
                        </span>
                    )}

                    {isDescanso ? (
                        <div className="section-summary-card__descanso" data-testid={`area-descanso-${name}`} title="Descanso" aria-label="Descanso">
                            <Moon size={14} aria-hidden="true" />
                        </div>
                    ) : (
                        <span
                            className={`section-summary-card__badge section-summary-card__badge--${statusTone}`}
                            aria-label={`${incidence} incidencias`}
                        >
                            {incidence}
                        </span>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <footer className="section-summary-card__footer">
                <div className="section-summary-card__kpis-group">
                    {opTitle && (
                        <div className="section-summary-card__op-title">{opTitle}</div>
                    )}
                    <dl className="section-summary-card__kpis">
                        <div className="section-summary-card__kpi">
                            <dt>Autorizado</dt>
                            <dd>{autorizado}</dd>
                        </div>
                        <div className="section-summary-card__kpi">
                            <dt>Contratados</dt>
                            <dd>{contratados}</dd>
                        </div>
                        <div className="section-summary-card__kpi">
                            <dt>Asistencia</dt>
                            <dd>{asistencia}</dd>
                        </div>
                    </dl>
                </div>
            </footer>
        </>
    );

    if (!isClickable) {
        return (
            <div
                className={className}
                data-testid={`area-card-${name.replace(/\s+/g, "-").toLowerCase()}`}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={className}
            aria-pressed={isSelected}
            aria-label={`Sección ${name}. Autorizado: ${autorizado}`}
            data-testid={`area-card-${name.replace(/\s+/g, "-").toLowerCase()}`}
        >
            {cardContent}
        </button>
    );
}
