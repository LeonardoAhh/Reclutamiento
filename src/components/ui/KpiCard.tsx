import React from 'react';
import './KpiCard.css';

export type KpiTone = "default" | "warning" | "destructive";

export interface KpiCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    tone?: KpiTone;
    onClick?: () => void;
}

export function KpiCard({
    label,
    value,
    sub,
    icon,
    tone = "default",
    onClick
}: KpiCardProps) {
    const toneClass = tone !== "default" ? ` kpi-card--${tone}` : "";
    
    if (onClick) {
        return (
            <button 
                type="button" 
                className={`kpi-card${toneClass} kpi-card--interactive`} 
                data-testid={`kpi-${tone}`}
                onClick={onClick}
            >
                <div className="kpi-card__icon-box" aria-hidden="true">{icon}</div>
                <div className="kpi-card__content">
                    <span className="kpi-card__label">{label}</span>
                    <div className="kpi-card__value-row">
                        <p className="kpi-card__value" title={String(value)}>{value}</p>
                        {sub && <p className="kpi-card__sub">{sub}</p>}
                    </div>
                </div>
            </button>
        );
    }

    return (
        <article className={`kpi-card${toneClass}`} data-testid={`kpi-${tone}`}>
            <div className="kpi-card__icon-box" aria-hidden="true">{icon}</div>
            <div className="kpi-card__content">
                <span className="kpi-card__label">{label}</span>
                <div className="kpi-card__value-row">
                    <p className="kpi-card__value" title={String(value)}>{value}</p>
                    {sub && <p className="kpi-card__sub">{sub}</p>}
                </div>
            </div>
        </article>
    );
}
