import { useEffect, useRef, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { useLanguage } from "@/contexts/LanguageContext";
import { workforceText } from "@/pages/workforce-translations";
import { WeeklyHiresModal } from "@/components/ui/WeeklyHiresModal";
import { FutureHiresModal } from "@/components/ui/FutureHiresModal";
import { CandidatesInProcessModal } from "@/components/ui/CandidatesInProcessModal";
import { CandidatesCitedTodayModal } from "@/components/ui/CandidatesCitedTodayModal";
import { MissingPositionsPage } from "@/pages/MissingPositionsPage";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { formatShortWeekdayDate } from "@/lib/dates";
import {
  pickEmphasizedCoverage,
  type CoverageKey,
} from "@/lib/workforceProjection";
import { OverviewWeekSwitcher } from "./kpis-components/OverviewWeekSwitcher";
import { OverviewKpiCard } from "./kpis-components/OverviewKpiCard";
import { OverviewCoverage } from "./kpis-components/OverviewCoverage";
import { OverviewVacancyChart } from "./kpis-components/OverviewVacancyChart";
import { useOverviewData } from "./kpis-components/useOverviewData";
import "./KpisPage.css";

/*
 * /overview comparte la misma composición en móvil y escritorio:
 * selector de semana, cuatro tarjetas KPI, cobertura y gráfica.
 * Solo cambia la disposición responsive.
 */
export function KpisPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const t = (text: string) => workforceText(language, text);
  const {
    loading,
    employees,
    bajas,
    positions,
    dismissedKeys,
    currentPositionCoverage,
    projectionTotals,
    weekOffset,
    setWeekOffset,
    currentWeek,
    currentWeekLabel,
    previousWeek,
    previousWeekLabel,
    weeklyHires,
    weeklyBajas,
    previousWeekHires,
    previousWeekBajas,
    weeklyFutureHires,
    candidatesInProcess,
    candidatesCitadosHoy,
    candidateTotals,
    todayIso,
  } = useOverviewData();

  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [futureHiresModalOpen, setFutureHiresModalOpen] = useState(false);
  const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
  const [citedTodayModalOpen, setCitedTodayModalOpen] = useState(false);
  const [missingPositionsPageOpen, setMissingPositionsPageOpen] = useState(false);
  const [coverageSelection, setCoverageSelection] = useState<CoverageKey | null>(null);
  const overviewTitleRef = useRef<HTMLHeadingElement>(null);
  const wasMissingPositionsPageOpenRef = useRef(false);

  useEffect(() => {
    if (!missingPositionsPageOpen && wasMissingPositionsPageOpenRef.current) {
      overviewTitleRef.current?.focus({ preventScroll: true });
    }
    wasMissingPositionsPageOpenRef.current = missingPositionsPageOpen;
  }, [missingPositionsPageOpen]);

  const emphasizedCoverage =
    coverageSelection ?? pickEmphasizedCoverage(projectionTotals.current);
  const hiresDelta = weeklyHires.length - previousWeekHires.length;

  if (missingPositionsPageOpen) {
    return (
      <BoneyardSkeleton
        name="resumen-page"
        loading={loading}
        loadingLabel={t("Cargando resumen…")}
      >
        <MissingPositionsPage
          coverage={currentPositionCoverage}
          onBack={() => setMissingPositionsPageOpen(false)}
        />
      </BoneyardSkeleton>
    );
  }

  return (
    <BoneyardSkeleton
      name="resumen-page"
      loading={loading}
      loadingLabel={t("Cargando resumen…")}
    >
      <main className="kpis-page container" id="page-kpis">
        <PageHeading ref={overviewTitleRef} tabIndex={-1} className="app-page-title">
          {t("Resumen")}
        </PageHeading>

        <div className="kpis-page__overview">
          <OverviewWeekSwitcher
            week={currentWeek.week}
            rangeLabel={currentWeekLabel}
            isCurrentWeek={weekOffset === 0}
            onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
            onNextWeek={() => setWeekOffset((prev) => prev + 1)}
            onToday={() => setWeekOffset(0)}
          />

          <section
            className="kpis-page__kpis"
            aria-label={t("KPIs consolidados")}
          >
            <OverviewKpiCard
              label={t("Ingresos")}
              value={weeklyHires.length}
              delta={{ value: hiresDelta, week: previousWeek.week }}
              onClick={() => setWeeklyModalOpen(true)}
            />
            <OverviewKpiCard
              label={t("Próximos ingresos")}
              value={weeklyFutureHires.length}
              onClick={() => setFutureHiresModalOpen(true)}
            />
            <OverviewKpiCard
              label={t("Entrevistas")}
              value={candidateTotals.citadosHoy}
              note={`${t("hoy")} · ${formatShortWeekdayDate(todayIso, en ? "en-US" : "es-MX")}`}
              onClick={() => setCitedTodayModalOpen(true)}
            />
            <OverviewKpiCard
              label={t("Procesos por cerrar")}
              value={candidateTotals.enProceso}
              onClick={() => setCandidatesModalOpen(true)}
            />
          </section>

          <OverviewCoverage
            projection={projectionTotals}
            selectedKey={emphasizedCoverage}
            onSelect={(key) => setCoverageSelection(key)}
          />

          <OverviewVacancyChart
            week={currentWeek}
            rangeLabel={currentWeekLabel}
            resultKey={emphasizedCoverage}
            locale={en ? "en-US" : "es-MX"}
            employees={employees}
            bajas={bajas}
            positions={positions}
            dismissedKeys={dismissedKeys}
            onOpenMissingPositions={() => setMissingPositionsPageOpen(true)}
          />
        </div>

        <CandidatesInProcessModal
          isOpen={candidatesModalOpen}
          onClose={() => setCandidatesModalOpen(false)}
          candidates={candidatesInProcess}
        />

        <CandidatesCitedTodayModal
          isOpen={citedTodayModalOpen}
          onClose={() => setCitedTodayModalOpen(false)}
          candidates={candidatesCitadosHoy}
        />

        <WeeklyHiresModal
          isOpen={weeklyModalOpen}
          onClose={() => setWeeklyModalOpen(false)}
          range={currentWeek}
          rangeLabel={currentWeekLabel}
          hires={weeklyHires}
          bajas={weeklyBajas}
          previousRange={previousWeek}
          previousRangeLabel={previousWeekLabel}
          previousHires={previousWeekHires}
          previousBajas={previousWeekBajas}
        />

        <FutureHiresModal
          isOpen={futureHiresModalOpen}
          onClose={() => setFutureHiresModalOpen(false)}
          futureHires={weeklyFutureHires}
        />
      </main>
    </BoneyardSkeleton>
  );
}
