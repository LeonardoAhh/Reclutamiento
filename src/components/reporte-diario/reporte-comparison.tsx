import { useState } from "react";
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";
import { Modal } from "@/components/ui/Modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteComparisonDialogProps {
    summaries: ReporteDiarioSummary[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

const AUSENTISMO_THRESHOLD = 2.5;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatShortMes(ym: string): string {
    const [year, month] = ym.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1] ?? month} ${year}`;
}

function ausentismoTone(pct: number): "ok" | "warn" | "error" {
    if (pct > AUSENTISMO_THRESHOLD * 2) return "error";
    if (pct > AUSENTISMO_THRESHOLD) return "warn";
    return "ok";
}

function TrendDelta({ diff, suffix = "", decimals = 0 }: { diff: number; suffix?: string; decimals?: number }) {
    const formatted = decimals > 0 ? Math.abs(diff).toFixed(decimals) : String(Math.abs(diff));
    const color = diff > 0 ? "var(--color-error)" : diff < 0 ? "var(--color-success)" : "var(--color-muted)";
    const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
    return (
        <span className="reporte-cmp__trend" style={{ color }}>
            <Icon size={14} aria-hidden="true" />
            {diff > 0 ? "+" : diff < 0 ? "−" : ""}{formatted}{suffix}
        </span>
    );
}

// ─── Subcomponent: Trigger ─────────────────────────────────────────────────────

function TriggerButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="reporte-saved__trigger"
            data-testid="open-comparison-btn"
        >
            <span className="reporte-saved__trigger-left">
                <span className="reporte-saved__trigger-icon">
                    <BarChart3 size={16} />
                </span>
                <span className="reporte-saved__trigger-text">Comparativa mensual</span>
            </span>
            <ChevronRight size={16} className="reporte-saved__trigger-chevron" aria-hidden="true" />
        </button>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteComparisonDialog({
    summaries,
}: ReporteComparisonDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    if (summaries.length < 2) return null;

    // Newest first for reading; trend compares against the chronologically previous month.
    const chrono = [...summaries].sort((a, b) => a.mes.localeCompare(b.mes));
    const prevByMes = new Map<string, ReporteDiarioSummary>();
    chrono.forEach((s, i) => { if (i > 0) prevByMes.set(s.mes, chrono[i - 1]); });
    const rows = [...chrono].reverse();

    const toggle = (mes: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(mes)) next.delete(mes);
            else next.add(mes);
            return next;
        });
    };

    return (
        <>
            <TriggerButton onClick={() => setIsOpen(true)} />

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Comparativa mensual"
                subtitle="Evolución de incidencias y ausentismo mes a mes."
                size="xl"
                fullscreenMobile={true}
            >
                <div className="reporte-cmp__body">
                    {/* Desktop table */}
                    <div className="reporte-cmp__table-wrap">
                        <table className="reporte-cmp__table">
                            <thead>
                                <tr>
                                    <th scope="col">Mes</th>
                                    <th scope="col" className="reporte-cmp__num">Empleados</th>
                                    <th scope="col" className="reporte-cmp__num">Días disp.</th>
                                    <th scope="col" className="reporte-cmp__num">Ausentismo</th>
                                    <th scope="col" className="reporte-cmp__num">% Ausent.</th>
                                    <th scope="col" className="reporte-cmp__num">Incidencias</th>
                                    <th scope="col" className="reporte-cmp__num">Tend.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => {
                                    const prev = prevByMes.get(s.mes) ?? null;
                                    const incDiff = prev ? s.total_incidencias - prev.total_incidencias : 0;
                                    return (
                                        <tr key={s.id}>
                                            <td className="reporte-cmp__mes">{formatShortMes(s.mes)}</td>
                                            <td className="reporte-cmp__num">{s.total_empleados}</td>
                                            <td className="reporte-cmp__num">{s.dias_disponibles}</td>
                                            <td className="reporte-cmp__num">{s.total_ausentismo}</td>
                                            <td className="reporte-cmp__num">
                                                <span className={`reporte-inc-badge reporte-inc-badge--${ausentismoTone(s.pct_ausentismo)}`}>
                                                    {s.pct_ausentismo.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="reporte-cmp__num reporte-cmp__strong">{s.total_incidencias}</td>
                                            <td className="reporte-cmp__num">
                                                {prev ? <TrendDelta diff={incDiff} /> : <span className="reporte-cmp__muted">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards with inline expand */}
                    <ul className="reporte-cmp__cards" aria-label="Comparativa mensual">
                        {rows.map((s) => {
                            const prev = prevByMes.get(s.mes) ?? null;
                            const incDiff = prev ? s.total_incidencias - prev.total_incidencias : 0;
                            const ausDiff = prev ? s.pct_ausentismo - prev.pct_ausentismo : 0;
                            const isOpenRow = expanded.has(s.mes);
                            const detailId = `cmp-detail-${s.mes}`;
                            return (
                                <li key={s.id} className="reporte-incidents__card">
                                    <button
                                        type="button"
                                        className="reporte-incidents__card-summary"
                                        aria-expanded={isOpenRow}
                                        aria-controls={detailId}
                                        onClick={() => toggle(s.mes)}
                                        data-testid={`cmp-card-${s.mes}`}
                                    >
                                        <span className="reporte-incidents__card-main">
                                            <span className="reporte-incidents__card-name">{formatShortMes(s.mes)}</span>
                                            <span className="reporte-incidents__card-tags">
                                                <span className="reporte-chip">{s.total_incidencias} inc.</span>
                                                <span className={`reporte-inc-badge reporte-inc-badge--${ausentismoTone(s.pct_ausentismo)}`}>
                                                    {s.pct_ausentismo.toFixed(2)}%
                                                </span>
                                            </span>
                                        </span>
                                        {prev && <TrendDelta diff={incDiff} />}
                                        <ChevronRight size={18} className="reporte-incidents__chevron" aria-hidden="true" />
                                    </button>

                                    {isOpenRow && (
                                        <div id={detailId} className="reporte-incidents__card-detail">
                                            <span className="reporte-incidents__detail-label">Empleados</span>
                                            <span className="reporte-incidents__detail-value">{s.total_empleados}</span>
                                            <span className="reporte-incidents__detail-label">Días disponibles</span>
                                            <span className="reporte-incidents__detail-value">{s.dias_disponibles}</span>
                                            <span className="reporte-incidents__detail-label">Total ausentismo</span>
                                            <span className="reporte-incidents__detail-value">{s.total_ausentismo}</span>
                                            {prev && (
                                                <>
                                                    <span className="reporte-incidents__detail-label">Tend. incidencias</span>
                                                    <span className="reporte-incidents__detail-value"><TrendDelta diff={incDiff} /></span>
                                                    <span className="reporte-incidents__detail-label">Tend. ausentismo</span>
                                                    <span className="reporte-incidents__detail-value"><TrendDelta diff={ausDiff} suffix="%" decimals={2} /></span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Modal>
        </>
    );
}
