import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { workforceText } from "@/pages/workforce-translations";
import "./OverviewKpiCard.css";

interface DeltaInfo {
  value: number;
  week: number;
}

interface Props {
  label: string;
  value: number;
  delta?: DeltaInfo;
  note?: string;
  onClick: () => void;
}

export function OverviewKpiCard({ label, value, delta, note, onClick }: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);

  const DeltaIcon =
    delta === undefined || delta.value === 0
      ? Minus
      : delta.value > 0
        ? ChevronUp
        : ChevronDown;

  const deltaText = delta
    ? delta.value === 0
      ? `= ${t("igual que")} ${t("semana")} ${delta.week}`
      : `${delta.value > 0 ? "+" : "−"}${Math.abs(delta.value)} ${t("vs.")} ${t("semana")} ${delta.week}`
    : null;

  return (
    <button
      data-cuelume-tap=""
      type="button"
      className="overview-kpi"
      onClick={onClick}
    >
      <span className="overview-kpi__label">{label}</span>
      <span className="overview-kpi__value">{value}</span>
      {deltaText && (
        <span className="overview-kpi__footer">
          <DeltaIcon className="overview-kpi__footer-icon" aria-hidden="true" />
          {deltaText}
        </span>
      )}
      {note && <span className="overview-kpi__footer">{note}</span>}
      <span className="sr-only">{t("Ver detalle")}</span>
    </button>
  );
}
