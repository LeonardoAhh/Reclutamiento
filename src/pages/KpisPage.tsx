import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RecruitmentHero } from '@/components/ui/RecruitmentHero';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  ShieldCheck,
  Timer,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { KpiReveal, useKpiReveal } from '@/components/ui/KpiReveal';
import { WeeklyHiresModal } from '@/components/ui/WeeklyHiresModal';
import { CandidatesInProcessModal } from '@/components/ui/CandidatesInProcessModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useCandidates } from '@/hooks/useCandidates';
import { useBajas } from '@/hooks/useBajas';
import { usePositions } from '@/lib/positions';
import {
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  getCoverageColor,
} from '@/lib/utils';
import { computeMonthlyComparison } from '@/lib/bajas';
import { DEFAULT_VACANCY_SLA_DAYS } from '@/lib/types';
import type {
  Baja,
  Candidate,
  CandidateStatus,
  VacancyRequest,
  VacancyStatus,
} from '@/lib/types';
import {
  daysBetween,
  formatIsoWeekRange,
  isInIsoWeek,
  isoWeekOf,
  currentYearMx,
  localTodayIso,
} from '@/lib/dates';
import type { Employee } from '@/lib/types';
import './KpisPage.css';

/* Mismas constantes que las páginas de origen para que los KPIs cuadren. */
const ACTIVE_CANDIDATE_STATUSES: ReadonlyArray<CandidateStatus> = [
  'entrevista_1',
  'entrevista_2',
];

const OPEN_VACANCY_STATUSES: ReadonlyArray<VacancyStatus> = [
  'abierta',
  'en_proceso',
  'pausa',
];

interface VacancyMetrics {
  vencida: boolean;
}

function computeVacancyMetrics(v: VacancyRequest): VacancyMetrics {
  const sla = typeof v.dias_sla === 'number' ? v.dias_sla : DEFAULT_VACANCY_SLA_DAYS;
  const end = v.status === 'cubierta' && v.fecha_cubierta ? v.fecha_cubierta : new Date();
  const diasAbierta = v.fecha_apertura ? daysBetween(v.fecha_apertura, end) : 0;
  const vencida =
    v.status !== 'cubierta' &&
    v.status !== 'cancelada' &&
    diasAbierta > sla;
  return { vencida };
}

interface KpiDescriptor {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  variant?: 'cream' | 'dark';
  /** Página de origen — mostrada como overline para que el usuario sepa el contexto. */
  origin: string;
}

export function KpisPage() {
const { profile, username } = useAuth();
const rawName = profile?.display_name || username || 'Usuario';
const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const { employees, comments } = useSupabaseData();
  const { vacancies } = useVacancyRequests();
  const { candidates } = useCandidates();
  const { bajas } = useBajas();
  const { positions } = usePositions();

  const reveal = useKpiReveal();
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);

  /* ── Semana ISO actual + semana anterior ──────────────────── */
  const currentWeek = useMemo(() => isoWeekOf(new Date()), []);
  const currentWeekLabel = useMemo(
    () => formatIsoWeekRange(currentWeek),
    [currentWeek]
  );
  // Restamos 24h al inicio de la semana actual para caer en cualquier
  // día válido de la semana anterior; isoWeekOf normaliza el rango.
  const previousWeek = useMemo(
    () => isoWeekOf(new Date(currentWeek.start.getTime() - 24 * 60 * 60 * 1000)),
    [currentWeek]
  );
  const previousWeekLabel = useMemo(
    () => formatIsoWeekRange(previousWeek),
    [previousWeek]
  );
  const weeklyHires: Employee[] = useMemo(
    () =>
      employees
        .filter((e) => isInIsoWeek(e.fecha_ingreso, currentWeek))
        .sort((a, b) => String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso))),
    [employees, currentWeek]
  );
  const weeklyBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, currentWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, currentWeek]
  );
  const previousWeekHires: Employee[] = useMemo(
    () =>
      employees
        .filter((e) => isInIsoWeek(e.fecha_ingreso, previousWeek))
        .sort((a, b) => String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso))),
    [employees, previousWeek]
  );
  const previousWeekBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, previousWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, previousWeek]
  );
  const weeklyHiresSubtitle = useMemo(() => {
    const diff = weeklyHires.length - previousWeekHires.length;
    const sign = diff > 0 ? '+' : '';
    return `Sem. ${previousWeek.week}: ${previousWeekHires.length} (${sign}${diff})`;
  }, [weeklyHires.length, previousWeekHires.length, previousWeek.week]);

  /* ── Vacantes (5) ──────────────────────────────────────────── */
  const vacancyTotals = useMemo(() => {
    let abiertas = 0;
    let enSla = 0;
    let vencidas = 0;
    let cubiertas = 0;
    let ttfSum = 0;
    let ttfCount = 0;
    let excluidas = 0;

    for (const v of vacancies) {
      if (v.excluida_indicador) {
        excluidas += 1;
        continue;
      }
      const m = computeVacancyMetrics(v);
      if (OPEN_VACANCY_STATUSES.includes(v.status)) {
        abiertas += 1;
        if (m.vencida) vencidas += 1;
        else enSla += 1;
      } else if (v.status === 'cubierta') {
        cubiertas += 1;
        if (v.fecha_apertura && v.fecha_cubierta) {
          ttfSum += daysBetween(v.fecha_apertura, v.fecha_cubierta);
          ttfCount += 1;
        }
      }
    }

    const ttfPromedio = ttfCount > 0 ? Math.round(ttfSum / ttfCount) : 0;
    return { abiertas, enSla, vencidas, ttfPromedio, excluidas };
  }, [vacancies]);

  /* ── Candidatos (5) ────────────────────────────────────────── */
  const candidatesInProcess: Candidate[] = useMemo(
    () => candidates.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status)),
    [candidates]
  );
  // "Citados hoy" — candidatos con `fecha_cita` igual a la fecha civil de hoy
  // en TZ MX. `localTodayIso()` ya devuelve YYYY-MM-DD anclado a Querétaro,
  // y la columna se persiste como `date` (sin TZ) → comparación lexical exacta.
  const candidatesCitadosHoy: Candidate[] = useMemo(() => {
    const today = localTodayIso();
    return candidates.filter((c) => (c.fecha_cita ?? '') === today);
  }, [candidates]);
  const candidateTotals = useMemo(() => {
    const total = candidates.length;
    const enProceso = candidatesInProcess.length;
    const citadosHoy = candidatesCitadosHoy.length;
    const contratados = candidates.filter((c) => c.status === 'contratado').length;
    const rechazados = candidates.filter((c) => c.status === 'rechazado').length;
    return { total, enProceso, citadosHoy, contratados, rechazados };
  }, [candidates, candidatesInProcess, candidatesCitadosHoy]);

  /* ── Dashboard (4) ─────────────────────────────────────────── */
  const dashboardTotals = useMemo(() => {
    const positionCoverage = calculatePositionCoverage(employees, comments, positions);
    const departmentCoverage = calculateDepartmentCoverage(positionCoverage);
    const autorizada = departmentCoverage.reduce((s, d) => s + d.plantilla_autorizada, 0);
    const objetivo = departmentCoverage.reduce((s, d) => s + d.plantilla_objetivo, 0);
    const real = departmentCoverage.reduce((s, d) => s + d.plantilla_real, 0);
    const vacantes = departmentCoverage.reduce((s, d) => s + d.vacantes, 0);
    // Cobertura global = real / (autorizada + backup). El backup cuenta como
    // parte del objetivo cuando está definido en PLANTILLA_AUTORIZADA.
    const cobertura = objetivo > 0 ? Math.round((real / objetivo) * 100) : 0;
    return { autorizada, real, vacantes, cobertura };
  }, [employees, comments, positions]);

  /* ── Bajas (4) ─────────────────────────────────────────────── */
  const bajasTotals = useMemo(() => {
    const year = currentYearMx();
    const { totals } = computeMonthlyComparison(bajas, employees, year);
    return totals;
  }, [bajas, employees]);

  /* ── KPI list — el orden lo dicta el usuario ───────────────── */
  const cards: KpiDescriptor[] = useMemo(
    () => [

      // Card semanal (18) — con botón para abrir modal de detalle.
      {
        id: 'kpi-ingresos-semana',
        label: 'Ingresos esta semana',
        value: weeklyHires.length,
        icon: <CalendarPlus size={20} aria-hidden="true" />,
        accentColor: 'var(--color-primary)',
        origin: 'Bajas',
      },
      // Citados hoy — cuenta candidatos con `fecha_cita = hoy (TZ MX)`.
      // Aparece junto a "En proceso" porque es info accionable del día.
      {
        id: 'stat-pipeline-citados-hoy',
        label: 'Citados hoy',
        value: candidateTotals.citadosHoy,
        icon: <CalendarCheck size={20} aria-hidden="true" />,
        accentColor: 'var(--color-accent-teal)',
        origin: 'Candidatos',
      },
      {
        id: 'stat-pipeline-activo',
        label: 'En proceso',
        value: candidateTotals.enProceso,
        icon: <Activity size={20} aria-hidden="true" />,
        accentColor: 'var(--color-primary)',
        origin: 'Candidatos',
      },
      // Vacantes (1-5)
      {
        id: 'stat-vac-abiertas',
        label: 'Abiertas',
        value: vacancyTotals.abiertas,
        icon: <ClipboardList size={20} aria-hidden="true" />,
        accentColor: 'var(--color-primary)',
        origin: 'Vacantes',
      },
      {
        id: 'stat-vac-sla',
        label: 'En tiempo',
        value: vacancyTotals.enSla,
        icon: <CheckCircle2 size={20} aria-hidden="true" />,
        accentColor: 'var(--color-accent-teal)',
        origin: 'Vacantes',
      },
      {
        id: 'stat-vac-vencidas',
        label: 'Vencidas',
        value: vacancyTotals.vencidas,
        icon: <AlertTriangle size={20} aria-hidden="true" />,
        accentColor: 'var(--color-error)',
        origin: 'Vacantes',
      },
      {
        id: 'stat-vac-ttf',
        label: 'TTF prom. (días)',
        value: vacancyTotals.ttfPromedio,
        icon: <Timer size={20} aria-hidden="true" />,
        accentColor: 'var(--color-ink)',
        origin: 'Vacantes',
      },
      {
        id: 'stat-vac-excluidas',
        label: 'Excluidas KPI',
        value: vacancyTotals.excluidas,
        icon: <EyeOff size={20} aria-hidden="true" />,
        accentColor: 'var(--color-muted)',
        origin: 'Vacantes',
      },
      // Candidatos (6-9)
      {
        id: 'stat-pipeline-total',
        label: 'Total',
        value: candidateTotals.total,
        icon: <Users size={20} aria-hidden="true" />,
        accentColor: 'var(--color-ink)',
        origin: 'Candidatos',
      },
      {
        id: 'stat-pipeline-contratado',
        label: 'Contratados',
        value: candidateTotals.contratados,
        icon: <UserCheck size={20} aria-hidden="true" />,
        accentColor: 'var(--color-accent-teal)',
        origin: 'Candidatos',
      },
      {
        id: 'stat-pipeline-rechazado',
        label: 'Rechazados',
        value: candidateTotals.rechazados,
        icon: <UserX size={20} aria-hidden="true" />,
        accentColor: 'var(--color-error)',
        origin: 'Candidatos',
      },
      // Dashboard (10-13)
      {
        id: 'stat-autorizada',
        label: 'Plantilla Autorizada',
        value: dashboardTotals.autorizada,
        icon: <Users size={20} aria-hidden="true" />,
        accentColor: 'var(--color-ink)',
        origin: 'Dashboard',
      },
      {
        id: 'stat-real',
        label: 'Plantilla Real',
        value: dashboardTotals.real,
        icon: <UserCheck size={20} aria-hidden="true" />,
        accentColor: 'var(--color-accent-teal)',
        origin: 'Dashboard',
      },
      {
        id: 'stat-vacantes',
        label: 'Vacantes',
        value: dashboardTotals.vacantes,
        icon: <UserX size={20} aria-hidden="true" />,
        accentColor: 'var(--color-error)',
        origin: 'Dashboard',
      },
      {
        id: 'stat-cobertura',
        label: '% Cobertura Global',
        value: `${dashboardTotals.cobertura}%`,
        icon: <TrendingUp size={20} aria-hidden="true" />,
        accentColor: getCoverageColor(dashboardTotals.cobertura),
        variant: 'dark',
        origin: 'Dashboard',
      },
      // Bajas (14-17)
      {
        id: 'kpi-bajas',
        label: 'Bajas',
        value: bajasTotals.bajas,
        icon: <UserMinus size={20} aria-hidden="true" />,
        accentColor: 'var(--color-error)',
        origin: 'Bajas',
      },
      {
        id: 'kpi-ingresos',
        label: 'Ingresos',
        value: bajasTotals.ingresos,
        icon: <UserPlus size={20} aria-hidden="true" />,
        accentColor: 'var(--color-success)',
        origin: 'Bajas',
      },
      {
        id: 'kpi-cobertura',
        label: 'Cobertura',
        value: `${bajasTotals.coverturaPct}%`,
        icon: <ShieldCheck size={20} aria-hidden="true" />,
        accentColor: 'var(--color-accent-teal)',
        origin: 'Bajas',
      },
      {
        id: 'kpi-solo-induccion',
        label: 'Solo Inducción',
        value: bajasTotals.soloInduccion,
        icon: <BadgeCheck size={20} aria-hidden="true" />,
        accentColor: 'var(--color-muted)',
        origin: 'Bajas',
      },
    ],
    [
      vacancyTotals,
      candidateTotals,
      dashboardTotals,
      bajasTotals,
      weeklyHires,
      weeklyHiresSubtitle,
      currentWeek,
      currentWeekLabel,
    ]
  );

  const revealedCount = cards.filter((c) => reveal.isRevealed(c.id)).length;

  return (
    <main className="kpis-page container" id="page-kpis">
      <RecruitmentHero displayName={displayName} />

      <section className="kpis-page__hero">
        <div>
          <h1 className="kpis-page__title">Indicadores</h1>
        </div>
        <div className="kpis-page__hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={reveal.hideAll}
            disabled={revealedCount === 0}
            title="Volver a ocultar todas las cards"
          >
            Incognito
          </button>
        </div>
      </section>

      <section className="kpis-page__grid" aria-label="KPIs consolidados">
        {cards.map((card) => {
          const revealed = reveal.isRevealed(card.id);
          const isWeeklyCard = card.id === 'kpi-ingresos-semana';
          const isInProcessCard = card.id === 'stat-pipeline-activo';
          const hasModal = isWeeklyCard || isInProcessCard;
          return (
            <KpiReveal
              key={card.id}
              id={card.id}
              label={card.label}
              revealed={revealed}
              onReveal={() => reveal.reveal(card.id)}
              onHide={() => reveal.hide(card.id)}
            >
              <div className="kpis-page__card">
                <span className="kpis-page__origin">{card.origin}</span>
                <StatCard
                  id={card.id}
                  label={card.label}
                  value={card.value}
                  subtitle={card.subtitle}
                  icon={card.icon}
                  accentColor={card.accentColor}
                  variant={card.variant}
                />
                {hasModal && revealed && (
                  <button
                    type="button"
                    className="kpis-page__detail-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isWeeklyCard) setWeeklyModalOpen(true);
                      else if (isInProcessCard) setCandidatesModalOpen(true);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label={
                      isWeeklyCard
                        ? 'Ver puestos contratados esta semana'
                        : 'Ver puestos en proceso del pipeline'
                    }
                  >
                    <Eye size={14} aria-hidden="true" />
                    Detalle
                  </button>
                )}
              </div>
            </KpiReveal>
          );
        })}
      </section>

      <CandidatesInProcessModal
        isOpen={candidatesModalOpen}
        onClose={() => setCandidatesModalOpen(false)}
        candidates={candidatesInProcess}
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
    </main>
  );
}
