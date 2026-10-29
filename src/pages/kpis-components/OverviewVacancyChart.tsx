import { useId, useMemo } from "react";
import { ClipboardList } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { IsoWeekRange } from "@/lib/dates";
import type { AuthorizedPosition, Baja, Employee } from "@/lib/types";
import type { CoverageKey } from "@/lib/workforceProjection";
import { workforceText } from "@/pages/workforce-translations";
import { coverageCategoryLabel } from "./overview-categories";
import {
  buildVacancySeries,
  type VacancySeriesPoint,
} from "./overview-vacancy-series";
import "./OverviewVacancyChart.css";

const SERIES = [
  {
    key: "plantilla",
    label: "Plantilla",
    color: "var(--color-error)",
    dash: undefined,
  },
  {
    key: "backup",
    label: "Backup",
    color: "var(--color-accent-amber)",
    dash: "var(--chart-dash-short)",
  },
  {
    key: "starlite",
    label: "Starlite",
    color: "var(--color-accent-purple-deep)",
    dash: "var(--chart-dash-dotted)",
  },
] as const;

interface Props {
  week: IsoWeekRange;
  rangeLabel: string;
  resultKey: CoverageKey;
  employees: readonly Employee[];
  bajas: readonly Baja[];
  positions: AuthorizedPosition[];
  dismissedKeys: ReadonlySet<string>;
  locale: string;
  onOpenMissingPositions: () => void;
}

interface DotProps {
  cx?: number;
  cy?: number;
  fill: string;
  stroke?: string;
  active?: boolean;
}

function isFinitePair(cx?: number, cy?: number): cx is number {
  return (
    typeof cx === "number" &&
    Number.isFinite(cx) &&
    typeof cy === "number" &&
    Number.isFinite(cy)
  );
}

function SeriesDot({ cx, cy, fill, stroke, active = false }: DotProps) {
  if (!isFinitePair(cx, cy)) return <g />;
  return (
    <circle
      className={`overview-chart__dot${active ? " overview-chart__dot--active" : ""}`}
      cx={cx}
      cy={cy}
      fill={fill}
      stroke={stroke}
    />
  );
}

function SeriesMarker({ dataKey }: { dataKey: string }) {
  const series = SERIES.find((item) => item.key === dataKey);
  if (!series) return null;
  return (
    <svg
      className={`overview-chart__marker overview-chart__marker--${series.key}`}
      viewBox="0 0 24 8"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="0" y1="4" x2="24" y2="4" strokeDasharray={series.dash} />
      <circle cx="12" cy="4" />
    </svg>
  );
}

type CustomTooltipPayloadItem = {
  name: string;
  value: number;
  color: string;
  dataKey: string;
};

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { language } = useLanguage();
  if (!active || !payload?.length) return null;

  return (
    <div role="tooltip" className="overview-chart__tooltip">
      <p className="overview-chart__tooltip-title">{String(label ?? "")}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="overview-chart__tooltip-row">
          <span
            className={`overview-chart__swatch overview-chart__swatch--${entry.dataKey}`}
            aria-hidden="true"
          />
          <span>{entry.name}</span>
          <strong>
            {Number(entry.value).toLocaleString(language === "en" ? "en-US" : "es-MX")}
          </strong>
        </p>
      ))}
    </div>
  );
}

function formatAxisValue(value: number): string {
  return Number.isInteger(value) ? String(value) : "";
}

export function OverviewVacancyChart({
  week,
  rangeLabel,
  resultKey,
  employees,
  bajas,
  positions,
  dismissedKeys,
  locale,
  onOpenMissingPositions,
}: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const titleId = useId();
  const descriptionId = useId();

  const data = useMemo<VacancySeriesPoint[]>(
    () =>
      buildVacancySeries({
        week,
        employees,
        bajas,
        positions,
        dismissedKeys,
        locale,
      }),
    [week, employees, bajas, positions, dismissedKeys, locale],
  );

  const isEmpty = data.length === 0;

  return (
    <figure
      className="overview-chart"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="overview-chart__header">
        <div className="overview-chart__heading">
          <h2 id={titleId} className="overview-chart__title">
            {t("Vacantes por día")}
          </h2>
          <p className="overview-chart__subtitle">
            {t("Resultado")}: {t(coverageCategoryLabel(resultKey))} · {rangeLabel}
          </p>
        </div>

        <button
          data-cuelume-tap=""
          type="button"
          className="overview-chart__action"
          onClick={onOpenMissingPositions}
        >
          <ClipboardList size={16} aria-hidden="true" />
          <span>{t("Ver vacantes pendientes")}</span>
        </button>
      </header>

      <p id={descriptionId} className="sr-only">
        {t("Semana")} {week.week} · {rangeLabel}. {t("Series de vacantes")}:{" "}
        {SERIES.map((series) => t(series.label)).join(", ")}.
      </p>

      <ul className="overview-chart__legend" aria-label={t("Series de vacantes")}>
        {SERIES.map((series) => (
          <li key={series.key}>
            <SeriesMarker dataKey={series.key} />
            {t(series.label)}
          </li>
        ))}
      </ul>

      {isEmpty ? (
        <p className="overview-chart__empty">{t("Sin datos para mostrar")}</p>
      ) : (
        <div className="overview-chart__plot">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart
              data={data}
              margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              accessibilityLayer
              aria-label={t("Vacantes por día")}
            >
              <CartesianGrid
                strokeDasharray="var(--chart-dash-short)"
                vertical={false}
                stroke="var(--color-hairline)"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                dy={8}
                tick={{
                  fill: "var(--color-muted)",
                  className: "overview-chart__axis",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
                tickFormatter={formatAxisValue}
                tick={{
                  fill: "var(--color-muted)",
                  className: "overview-chart__axis",
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "var(--color-muted)",
                  strokeDasharray: "var(--chart-dash-short)",
                }}
              />
              {SERIES.map((series) => (
                <Line
                  key={series.key}
                  type="linear"
                  dataKey={series.key}
                  name={t(series.label)}
                  stroke={series.color}
                  strokeWidth="var(--chart-line-width)"
                  strokeDasharray={series.dash}
                  strokeLinecap="round"
                  dot={
                    <SeriesDot
                      fill="var(--color-surface)"
                      stroke={series.color}
                    />
                  }
                  activeDot={
                    <SeriesDot
                      active
                      fill={series.color}
                      stroke="var(--color-surface)"
                    />
                  }
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
