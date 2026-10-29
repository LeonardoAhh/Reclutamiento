import { useId } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPercentage } from "@/lib/utils";
import type { CoverageKey, WorkforceProjection } from "@/lib/workforceProjection";
import { coverageStatus } from "@/lib/workforceProjection";
import { workforceText } from "@/pages/workforce-translations";
import { COVERAGE_CATEGORIES } from "./overview-categories";
import "./OverviewCoverage.css";

interface Props {
  projection: WorkforceProjection;
  selectedKey: CoverageKey;
  onSelect: (key: CoverageKey) => void;
}

export function OverviewCoverage({ projection, selectedKey, onSelect }: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const titleId = useId();

  return (
    <section className="overview-coverage" aria-labelledby={titleId}>
      <header className="overview-coverage__header">
        <h2 id={titleId} className="overview-coverage__title">
          {t("Cobertura de plantilla")}
        </h2>
      </header>

      <div className="overview-coverage__cards">
        {COVERAGE_CATEGORIES.map(({ key, label }) => {
          const current = projection.current[key];
          const status = coverageStatus(current.percentage);
          const StatusIcon = status === "goal" ? CircleCheck : TriangleAlert;
          const isSelected = key === selectedKey;

          return (
            <button
              data-cuelume-tap=""
              key={key}
              type="button"
              className="overview-coverage__card"
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
            >
              <span className="overview-coverage__card-head">
                <span className="overview-coverage__card-name">{t(label)}</span>
                {current.percentage !== null && (
                  <span className={`overview-coverage__status overview-coverage__status--${status}`}>
                    <StatusIcon
                      className="overview-coverage__status-icon"
                      aria-hidden="true"
                    />
                    {t(status === "goal" ? "En meta" : "Atención")}
                  </span>
                )}
              </span>

              <span className="overview-coverage__value">
                <span className="overview-coverage__percentage">
                  {current.percentage === null
                    ? t("No aplica")
                    : formatPercentage(current.percentage)}
                </span>
                {current.target > 0 && (
                  <span className="overview-coverage__vacancies">
                    {current.vacancies}{" "}
                    {t(current.vacancies === 1 ? "vacante" : "vacantes")}
                  </span>
                )}
              </span>

              <span className="overview-coverage__track" aria-hidden="true">
                {current.percentage !== null && (
                  <span
                    className={`overview-coverage__fill${status === "attention" ? " overview-coverage__fill--attention" : ""}`}
                    style={{ inlineSize: `${Math.min(Math.max(current.percentage, 0), 100)}%` }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {projection.undatedEmployees > 0 && (
        <p className="overview-coverage__note">
          {projection.undatedEmployees}{" "}
          {t("registros sin fecha válida de ingreso no están incluidos.")}
        </p>
      )}
      {projection.ambiguousEmployees > 0 && (
        <p className="overview-coverage__note">
          {projection.ambiguousEmployees}{" "}
          {t("registros coinciden con varios puestos y no están incluidos. Revisa su área, sección y puesto.")}
        </p>
      )}
    </section>
  );
}
