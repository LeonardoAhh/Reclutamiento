import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { workforceText } from "@/pages/workforce-translations";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { KpiReveal, useKpiReveal } from "@/components/ui/KpiReveal";
import { KpiHeroChart, DailyKpiData } from "@/components/ui/KpiHeroChart";
import { useDismissedPositions } from "@/hooks/useDismissedPositions";
import { WeeklyHiresModal } from "@/components/ui/WeeklyHiresModal";
import { FutureHiresModal } from "@/components/ui/FutureHiresModal";
import { CandidatesInProcessModal } from "@/components/ui/CandidatesInProcessModal";
import { CandidatesCitedTodayModal } from "@/components/ui/CandidatesCitedTodayModal";
import { MissingPositionsPage } from "@/pages/MissingPositionsPage";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useCandidates } from "@/hooks/useCandidates";
import { useBajas } from "@/hooks/useBajas";
import { usePositions } from "@/lib/positions";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { calculatePositionCoverage } from "@/lib/utils";
import type { Baja, Candidate } from "@/lib/types";
import {
  formatIsoWeekRange,
  isInIsoWeek,
  isoWeekOf,
  localTodayIso,
  addDaysToIso,
  formatProjectionDate,
} from "@/lib/dates";
import type { Employee } from "@/lib/types";
import {
  calculateWorkforceProjection,
  summarizeOperationalCoverage,
} from "@/lib/workforceProjection";
import { WorkforceProjection } from "./kpis-components/WeeklyWorkforceProjection";
import "./KpisPage.css";

/* Mismas constantes que las páginas de origen para que los KPIs cuadren. */

/** IDs de cards que siempre se muestran sin blur. */
const ALWAYS_VISIBLE_IDS: ReadonlySet<string> = new Set([
  "kpi-ingresos-semana",
  "kpi-proximos-ingresos",
  "stat-pipeline-citados-hoy",
  "stat-pipeline-activo",
]);

const MODAL_CARD_IDS: ReadonlySet<string> = new Set([
  "kpi-ingresos-semana",
  "kpi-proximos-ingresos",
  "stat-pipeline-activo",
  "stat-pipeline-citados-hoy",
]);

interface KpiDescriptor {
  id: string;
  label: string | React.ReactNode;
  value: string | number;
  subtitle?: string;
  accentColor: string;
  variant?: "cream" | "dark";
  origin: string;
}

export function KpisPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const t = (text: string) => workforceText(language, text);
  const {} = useAuth();
  const { employees, comments, loading: employeesLoading } = useSupabaseData();
  const { candidates, loading: candidatesLoading } = useCandidates();
  const { bajas, loading: bajasLoading } = useBajas();
  const { positions, loading: positionsLoading } = usePositions();

  // Stale-while-revalidate: el skeleton solo cubre la primera carga sin datos;
  // las revalidaciones en segundo plano no vuelven a ocultar la página.
  const loading =
    (employeesLoading && employees.length === 0) ||
    (candidatesLoading && candidates.length === 0) ||
    (bajasLoading && bajas.length === 0) ||
    (positionsLoading && positions.length === 0);

  const reveal = useKpiReveal();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [futureHiresModalOpen, setFutureHiresModalOpen] = useState(false);
  const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
  const [citedTodayModalOpen, setCitedTodayModalOpen] = useState(false);
  const [missingPositionsPageOpen, setMissingPositionsPageOpen] = useState(false);
  const overviewTitleRef = useRef<HTMLHeadingElement>(null);
  const wasMissingPositionsPageOpenRef = useRef(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!missingPositionsPageOpen && wasMissingPositionsPageOpenRef.current) {
      overviewTitleRef.current?.focus({ preventScroll: true });
    }
    wasMissingPositionsPageOpenRef.current = missingPositionsPageOpen;
  }, [missingPositionsPageOpen]);

  /* ── Semana ISO actual + semana anterior ──────────────────── */
  const currentWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return isoWeekOf(d);
  }, [weekOffset]);
  const currentWeekLabel = useMemo(
    () => formatIsoWeekRange(currentWeek, en ? "en-US" : "es-MX"),
    [currentWeek, en],
  );
  const previousWeek = useMemo(
    () =>
      isoWeekOf(new Date(currentWeek.start.getTime() - 24 * 60 * 60 * 1000)),
    [currentWeek],
  );
  const previousWeekLabel = useMemo(
    () => formatIsoWeekRange(previousWeek, en ? "en-US" : "es-MX"),
    [previousWeek, en],
  );
  const weeklyHires: Employee[] = useMemo(() => {
    const today = localTodayIso();
    return employees
      .filter(
        (e) =>
          isInIsoWeek(e.fecha_ingreso, currentWeek) &&
          String(e.fecha_ingreso).localeCompare(today) <= 0,
      )
      .sort((a, b) =>
        String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
      );
  }, [employees, currentWeek]);
  const weeklyHiresDateBadge = useMemo(() => {
    if (weeklyHires.length === 0) return null;
    return `${t("Semana")} ${currentWeek.week}`;
  }, [weeklyHires, currentWeek.week, language]);
  const weeklyBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, currentWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, currentWeek],
  );
  const previousWeekHires: Employee[] = useMemo(
    () =>
      employees
        .filter((e) => isInIsoWeek(e.fecha_ingreso, previousWeek))
        .sort((a, b) =>
          String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
        ),
    [employees, previousWeek],
  );
  const previousWeekBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, previousWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, previousWeek],
  );
  const weeklyFutureHires: Employee[] = useMemo(() => {
    const today = localTodayIso();
    return employees
      .filter(
        (e) =>
          isInIsoWeek(e.fecha_ingreso, currentWeek) &&
          String(e.fecha_ingreso).localeCompare(today) > 0,
      )
      .sort((a, b) =>
        String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
      );
  }, [employees, currentWeek]);
  const futureHiresDateBadge = useMemo(() => {
    if (weeklyFutureHires.length === 0) return null;
    return `${t("Semana")} ${currentWeek.week}`;
  }, [weeklyFutureHires, currentWeek.week, language]);
  /* ── Candidatos visibles ───────────────────────────────────── */
  const candidatesInProcess: Candidate[] = useMemo(
    () =>
      candidates.filter(
        (c) =>
          c.status === "entrega_documentos" ||
          c.status === "faltan_documentos" ||
          c.status === "feedback_pendiente",
      ),
    [candidates],
  );
  const candidatesCitadosHoy: Candidate[] = useMemo(() => {
    const today = localTodayIso();
    return candidates.filter(
      (c) => c.status === "entrevista" && (c.fecha_cita ?? "") === today,
    );
  }, [candidates]);
  const candidateTotals = useMemo(() => {
    const enProceso = candidatesInProcess.length;
    const citadosHoy = candidatesCitadosHoy.length;
    return { enProceso, citadosHoy };
  }, [candidatesInProcess, candidatesCitadosHoy]);

  /* ── Cobertura para el detalle de puestos pendientes ──────── */
  const currentPositionCoverage = useMemo(() => {
    return calculatePositionCoverage(employees, comments, positions);
  }, [employees, comments, positions]);

  /* ── Proyección Estratégica ─────────────────────────────────────────────── */
  const todayIso = useMemo(() => localTodayIso(), []);

  const { dismissedKeys } = useDismissedPositions();

  const projectionTotals = useMemo(
    () => calculateWorkforceProjection(employees, positions, todayIso, dismissedKeys),
    [employees, positions, todayIso, dismissedKeys],
  );

  /* ── Gráfica Hero (Semana en Curso) ────────────────────────── */
  const heroChartData = useMemo<DailyKpiData[]>(() => {
    if (!isDesktop || loading || missingPositionsPageOpen) return [];

    const days: DailyKpiData[] = [];
    const fmtDay = new Intl.DateTimeFormat(en ? "en-US" : "es-MX", {
      weekday: "short",
      day: "numeric",
      timeZone: "America/Mexico_City",
    });

    const y = currentWeek.start.getUTCFullYear();
    const m = String(currentWeek.start.getUTCMonth() + 1).padStart(2, "0");
    const d = String(currentWeek.start.getUTCDate()).padStart(2, "0");
    const startIso = `${y}-${m}-${d}`;

    for (let i = 0; i < 5; i++) {
      const currentDayIso = addDaysToIso(startIso, i) || "";
      const currentDayDate = new Date(`${currentDayIso}T12:00:00-06:00`);
      let dayName = fmtDay.format(currentDayDate).replace(",", "");
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      const realEmpleadosActuales = employees.filter(
        (e) => String(e.fecha_ingreso).localeCompare(currentDayIso) <= 0,
      );
      const realBajasHistoricas = bajas
        .filter(
          (b) =>
            String(b.fecha_ingreso).localeCompare(currentDayIso) <= 0 &&
            String(b.fecha_baja).localeCompare(currentDayIso) > 0,
        )
        .map(
          (b) =>
            ({
              ...b,
              turno: b.turno || "1",
              categoria: "",
            }) as Employee,
        );

      const mockEmployeesForDay = [
        ...realEmpleadosActuales,
        ...realBajasHistoricas,
      ];
      const projectionForDay = calculateWorkforceProjection(
        mockEmployeesForDay,
        positions,
        currentDayIso,
        dismissedKeys,
      );
      const operationalCoverage = summarizeOperationalCoverage(
        projectionForDay.current,
      );

      days.push({
        day: dayName,
        dateIso: currentDayIso,
        vacantesPlantilla: projectionForDay.current.plantilla.vacancies,
        vacantesBackup: projectionForDay.current.backup.vacancies,
        vacantesStarlite: projectionForDay.current.starlite.vacancies,
        cobertura: operationalCoverage.percentage ?? 0,
      });

      // Stop projecting past today if needed, but showing flat lines for the rest of the week is standard
      // unless we want to hide future days completely. We'll show up to Sunday to see the whole week frame.
    }

    return days;
  }, [currentWeek.start, employees, bajas, positions, dismissedKeys, en, isDesktop, loading, missingPositionsPageOpen]);

  /* ── KPI list — el orden lo dicta el usuario ───────────────── */
  const cards: KpiDescriptor[] = useMemo(
    () => [
      {
        id: "kpi-ingresos-semana",
        label: (
          <span className="kpis-page__label-with-badge">
            {t("Ingresos")}
            {weeklyHiresDateBadge && (
              <span className="kpis-page__date-badge">
                {weeklyHiresDateBadge}
              </span>
            )}
          </span>
        ),
        value: weeklyHires.length,
        accentColor: "var(--color-primary)",
        origin: "Bajas",
      },
      {
        id: "kpi-proximos-ingresos",
        label: (
          <span className="kpis-page__label-with-badge">
            {t("Proximos Ingresos")}
            {futureHiresDateBadge && (
              <span className="kpis-page__date-badge">
                {futureHiresDateBadge}
              </span>
            )}
          </span>
        ),
        value: weeklyFutureHires.length,
        accentColor: "var(--color-primary)",
        origin: "Bajas",
      },
      {
        id: "stat-pipeline-citados-hoy",
        label: (
          <span className="kpis-page__label-with-badge">
            {t("Entrevistas")}{" "}
            <span className="kpis-page__date-badge">
              {formatProjectionDate(todayIso)}
            </span>
          </span>
        ),
        value: candidateTotals.citadosHoy,
        accentColor: "var(--color-accent-teal)",
        origin: "Candidatos",
      },
      {
        id: "stat-pipeline-activo",
        label: t("Procesos por cerrar"),
        value: candidateTotals.enProceso,
        accentColor: "var(--color-primary)",
        origin: "Candidatos",
      },
    ],
    [
      candidateTotals,
      weeklyHires,
      currentWeek,
      currentWeekLabel,
      language,
    ],
  );

  /* ── Vista móvil: cards del grupo activo ───────────────────── */
  function openCardModal(id: string) {
    if (id === "kpi-ingresos-semana") setWeeklyModalOpen(true);
    else if (id === "kpi-proximos-ingresos") setFutureHiresModalOpen(true);
    else if (id === "stat-pipeline-activo") setCandidatesModalOpen(true);
    else if (id === "stat-pipeline-citados-hoy") setCitedTodayModalOpen(true);
  }

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
      <PageHeading ref={overviewTitleRef} tabIndex={-1} className="app-page-title">{t("Resumen")}</PageHeading>

      {isDesktop ? (
        <>
          {/* Visible al llegar: se muestra sin animación de entrada. */}
          <section className="kpis-page__chart-section">
            <KpiHeroChart
              data={heroChartData}
              onClick={() => setMissingPositionsPageOpen(true)}
              onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
              onNextWeek={() => setWeekOffset((prev) => prev + 1)}
              weekNumber={currentWeek.week}
              ariaLabel={t("Gráfica de vacantes de plantilla, backup y Starlite por día de la semana")}
            />
          </section>

          <WorkforceProjection projection={projectionTotals} />

          <section className="kpis-page__grid" aria-label={t("KPIs consolidados")}>
            {cards.map((card, index) => {
              const isAlwaysVisible = ALWAYS_VISIBLE_IDS.has(card.id);
              const revealed = isAlwaysVisible || reveal.isRevealed(card.id);
              const isWeeklyCard = card.id === "kpi-ingresos-semana";
              const isCitedTodayCard = card.id === "stat-pipeline-citados-hoy";
              const hasModal = MODAL_CARD_IDS.has(card.id);
              return (
                <KpiReveal
                  key={card.id}
                  id={card.id}
                  label={card.label}
                  revealed={revealed}
                  alwaysVisible={isAlwaysVisible}
                  onReveal={() => reveal.reveal(card.id)}
                  onHide={() => reveal.hide(card.id)}
                  style={{ "--kpi-stack-i": index } as React.CSSProperties}
                >
                  <div className="kpis-page__card">
                    <StatCard
                      id={card.id}
                      label={card.label}
                      value={card.value}
                      subtitle={card.subtitle}
                      accentColor={card.accentColor}
                      variant={card.variant}
                    />
                    {hasModal && revealed && (
                      <button data-cuelume-tap=""
                        className="kpis-page__detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCardModal(card.id);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label={
                          isWeeklyCard
                            ? t("Ver puestos contratados esta semana")
                            : isCitedTodayCard
                              ? t("Ver candidatos citados hoy")
                              : t("Ver puestos en proceso del pipeline")
                        }
                        title={t("Ver detalle")}
                      >
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </KpiReveal>
              );
            })}
          </section>
        </>
      ) : (
        <>
          <WorkforceProjection projection={projectionTotals} />

          <button data-cuelume-tap=""
            type="button"
            className="kpis-page__missing-positions-link"
            onClick={() => setMissingPositionsPageOpen(true)}
            aria-label={`${t("Ver detalle")} ${t("Vacantes Pendientes")}`}
            data-testid="kpis-mobile-missing-positions"
          >
            <span>{t("Vacantes Pendientes")}</span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          <section
            className="kpis-page__m-grid"
            aria-label={`${t("KPIs de")} ${t("Semana")}`}
            data-testid="kpis-mobile-grid"
          >
            {cards.map((card) => {
              const hasModal = MODAL_CARD_IDS.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`kpis-page__m-card ${hasModal ? "kpis-page__m-card--interactive" : ""}`}
                  onClick={hasModal ? () => openCardModal(card.id) : undefined}
                  role={hasModal ? "button" : undefined}
                  tabIndex={hasModal ? 0 : undefined}
                  onKeyDown={
                    hasModal
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openCardModal(card.id);
                          }
                        }
                      : undefined
                  }
                  aria-label={
                    hasModal ? `${t("Ver detalle")} ${card.label}` : undefined
                  }
                  data-testid={`kpis-mobile-card-${card.id}`}
                >
                  <StatCard
                    id={card.id}
                    label={card.label}
                    value={card.value}
                    subtitle={card.subtitle}
                    accentColor={card.accentColor}
                    variant={card.variant}
                  />
                  {hasModal && (
                    <div className="kpis-page__m-chevron" aria-hidden="true">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}

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
