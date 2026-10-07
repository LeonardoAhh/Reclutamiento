import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

// TODO: Temporalmente el objetivo de ausentismo está en 3.0% a petición del usuario.
// Regresarlo a 2.5 (u otro valor oficial) cuando sea requerido.
const AUSENTISMO_THRESHOLD = 3.0;

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function formatShortMes(ym: string, en: boolean): string {
  const [year, month] = ym.split("-");
  if (en) {
    const monthNumber = Number(month);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return ym;
    return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(Number(year), monthNumber - 1, 1))} ${year}`;
  }
  return `${MONTH_NAMES[parseInt(month, 10) - 1] ?? month} ${year}`;
}

export function getQuarterLabel(q: number, en: boolean): string {
  if (en) return ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"][q - 1] ?? "";
  if (q === 1) return "Ene-Mar";
  if (q === 2) return "Abr-Jun";
  if (q === 3) return "Jul-Sep";
  return "Oct-Dic";
}

export function ausentismoTone(pct: number): "ok" | "warn" | "error" {
  if (pct > AUSENTISMO_THRESHOLD * 2) return "error";
  if (pct > AUSENTISMO_THRESHOLD) return "warn";
  return "ok";
}

export function TrendDelta({
  diff,
  suffix = "",
  decimals = 0,
}: {
  diff: number;
  suffix?: string;
  decimals?: number;
}) {
  const formatted =
    decimals > 0 ? Math.abs(diff).toFixed(decimals) : String(Math.abs(diff));
  const tone = diff > 0 ? "error" : diff < 0 ? "success" : "muted";
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  return (
    <span className={`reporte-cmp__trend reporte-cmp__trend--${tone}`}>
      <Icon size="1em" aria-hidden="true" />
      {diff > 0 ? "+" : diff < 0 ? "−" : ""}
      {formatted}
      {suffix}
    </span>
  );
}

export function buildReportComparison(summaries: ReporteDiarioSummary[]) {
  // Newest first for reading; trend compares against the chronologically previous month.
  const chrono = [...summaries].sort((a, b) => a.mes.localeCompare(b.mes));
  const prevByMes = new Map<string, ReporteDiarioSummary>();
  chrono.forEach((s, i) => {
    if (i > 0) prevByMes.set(s.mes, chrono[i - 1]);
  });
  const rows = [...chrono].reverse();

  // ─── Quarterly aggregation ────────────────────────────
  const qMap = new Map<
    string,
    {
      year: string;
      quarter: number;
      totalAusentismo: number;
      diasDisponibles: number;
    }
  >();

  chrono.forEach((s) => {
    const [y, mStr] = s.mes.split("-");
    const monthNum = parseInt(mStr, 10);
    const q = Math.ceil(monthNum / 3);
    const key = `${y}-Q${q}`;

    if (!qMap.has(key)) {
      qMap.set(key, {
        year: y,
        quarter: q,
        totalAusentismo: 0,
        diasDisponibles: 0,
      });
    }
    const st = qMap.get(key);
    if (!st) return;
    st.totalAusentismo += s.total_ausentismo;
    st.diasDisponibles += s.dias_disponibles;
  });

  const quarters = Array.from(qMap.values()).reverse(); // newest first
  return { rows, prevByMes, quarters };
}
