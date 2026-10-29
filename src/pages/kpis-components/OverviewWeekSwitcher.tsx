import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { workforceText } from "@/pages/workforce-translations";
import "./OverviewWeekSwitcher.css";

interface Props {
  week: number;
  rangeLabel: string;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function OverviewWeekSwitcher({
  week,
  rangeLabel,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
}: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);

  return (
    <div className="overview-week" role="group" aria-label={t("Semana")}>
      <div className="overview-week__group">
        <button
          data-cuelume-tap=""
          type="button"
          className="overview-week__nav"
          onClick={onPrevWeek}
          aria-label={t("Semana anterior")}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <p className="overview-week__label" aria-live="polite">
          <span className="sr-only">{`${t("Semana")} ${week} · ${rangeLabel}`}</span>
          <span className="overview-week__label-visual" aria-hidden="true">
            <span className="overview-week__label-full">{t("Semana")}</span>
            <span className="overview-week__label-short">{t("Sem.")}</span>{" "}
            {week} · {rangeLabel}
          </span>
        </p>
        <button
          data-cuelume-tap=""
          type="button"
          className="overview-week__nav"
          onClick={onNextWeek}
          aria-label={t("Semana siguiente")}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <button
        data-cuelume-tap=""
        type="button"
        className="overview-week__today"
        onClick={onToday}
        disabled={isCurrentWeek}
      >
        <CalendarDays size={18} aria-hidden="true" />
        <span>{t("Hoy")}</span>
      </button>
    </div>
  );
}
