import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
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
  CandidateStatus,
  VacancyRequest,
  VacancyStatus,
} from '@/lib/types';
import { daysBetween } from '@/lib/dates';
import './KpisPage.css';

/* Mismas constantes que las páginas de origen para que los KPIs cuadren. */
const ACTIVE_CANDIDATE_STATUSES: ReadonlyArray<CandidateStatus> = [
  'aplico',
  'revision',
  'entrevista_1',
  'entrevista_2',
  'oferta',
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
  const { employees, comments } = useSupabaseData();
  const { vacancies } = useVacancyRequests();
  const { candidates } = useCandidates();
  const { bajas } = useBajas();
  const { positions } = usePositions();

  const reveal = useKpiReveal();

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

  /* ── Candidatos (4) ────────────────────────────────────────── */
  const candidateTotals = useMemo(() => {
    const total = candidates.length;
    const enProceso = candidates.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status)).length;
    const contratados = candidates.filter((c) => c.status === 'contratado').length;
    const rechazados = candidates.filter((c) => c.status === 'rechazado').length;
    return { total, enProceso, contratados, rechazados };
  }, [candidates]);

  /* ── Dashboard (4) ─────────────────────────────────────────── */
  const dashboardTotals = useMemo(() => {
    const positionCoverage = calculatePositionCoverage(employees, comments, positions);
    const departmentCoverage = calculateDepartmentCoverage(positionCoverage);
    const autorizada = departmentCoverage.reduce((s, d) => s + d.plantilla_autorizada, 0);
    const real = departmentCoverage.reduce((s, d) => s + d.plantilla_real, 0);
    const vacantes = departmentCoverage.reduce((s, d) => s + d.vacantes, 0);
    const cobertura = autorizada > 0 ? Math.round((real / autorizada) * 100) : 0;
    return { autorizada, real, vacantes, cobertura };
  }, [employees, comments, positions]);

  /* ── Bajas (4) ─────────────────────────────────────────────── */
  const bajasTotals = useMemo(() => {
    const year = new Date().getFullYear();
    const { totals } = computeMonthlyComparison(bajas, employees, year);
    return totals;
  }, [bajas, employees]);

  /* ── KPI list — el orden lo dicta el usuario ───────────────── */
  const cards: KpiDescriptor[] = useMemo(
    () => [
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
        id: 'stat-pipeline-activo',
        label: 'En proceso',
        value: candidateTotals.enProceso,
        icon: <Activity size={20} aria-hidden="true" />,
        accentColor: 'var(--color-primary)',
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
        subtitle: `${bajasTotals.cubiertas10d}/${bajasTotals.bajas} cubiertas`,
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
    [vacancyTotals, candidateTotals, dashboardTotals, bajasTotals]
  );

  const revealedCount = cards.filter((c) => reveal.isRevealed(c.id)).length;

  return (
    <main className="kpis-page container" id="page-kpis">
      <section className="kpis-page__hero">
        <div>
          <h1 className="kpis-page__title">Indicadores</h1>
          <p className="kpis-page__subtitle">
            Click sobre cualquier card para mostrar el valor. {revealedCount} de {cards.length} visibles.
          </p>
        </div>
        <div className="kpis-page__hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={reveal.hideAll}
            disabled={revealedCount === 0}
            title="Volver a ocultar todas las cards"
          >
            Ocultar todo
          </button>
        </div>
      </section>

      <section className="kpis-page__grid" aria-label="KPIs consolidados">
        {cards.map((card) => (
          <KpiReveal
            key={card.id}
            id={card.id}
            label={card.label}
            revealed={reveal.isRevealed(card.id)}
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
            </div>
          </KpiReveal>
        ))}
      </section>
    </main>
  );
}
