  import { useMemo, useState } from 'react';
  import { motion } from 'framer-motion';
  import { useAuth } from '@/hooks/useAuth';
  import { useMediaQuery } from '@/hooks/useMediaQuery';
  import { Eye } from 'lucide-react';
  import { StatCard } from '@/components/ui/StatCard';
  import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
  import { Reveal } from '@/components/ui/Reveal';
  import { staggerContainer, staggerItem } from '@/lib/motion';
  import { KpiReveal, useKpiReveal } from '@/components/ui/KpiReveal';
  import { KpiHeroChart, DailyKpiData } from '@/components/ui/KpiHeroChart';
  import { useDismissedPositions } from '@/hooks/useDismissedPositions';
  import { WeeklyHiresModal } from '@/components/ui/WeeklyHiresModal';
  import { CandidatesInProcessModal } from '@/components/ui/CandidatesInProcessModal';
  import { CandidatesCitedTodayModal } from '@/components/ui/CandidatesCitedTodayModal';
  import { TtfHistoryModal } from '@/components/ui/TtfHistoryModal';
  import { MissingPositionsModal } from '@/components/ui/MissingPositionsModal';
  import { useSupabaseData } from '@/hooks/useSupabaseData';
  import { useCandidates } from '@/hooks/useCandidates';
  import { useBajas } from '@/hooks/useBajas';
  import { computeAutoVacancies, autoVacancyToRequest } from '@/lib/autoVacancies';
  import { usePositions } from '@/lib/positions';
  import { KpiGridSkeleton } from '@/components/ui/PageSkeletons';
  import { Skeleton } from '@/components/ui/Skeleton';
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
    VacancyRequest,
    VacancyStatus,
  } from '@/lib/types';
  import {
    businessDaysBetween,
    formatIsoWeekRange,
    isInIsoWeek,
    isoWeekOf,
    currentYearMx,
    localTodayIso,
    addDaysToIso,
    getNextWednesdayIso,
    formatProjectionDate
  } from '@/lib/dates';
  import type { Employee } from '@/lib/types';
  import './KpisPage.css';

  /* Mismas constantes que las páginas de origen para que los KPIs cuadren. */

  const OPEN_VACANCY_STATUSES: ReadonlyArray<VacancyStatus> = [
    'abierta',
    'en_proceso',
    'pausa',
  ];

  /** IDs de cards que siempre se muestran sin blur. */
  const ALWAYS_VISIBLE_IDS: ReadonlySet<string> = new Set([
    'kpi-ingresos-semana',
    'stat-pipeline-citados-hoy',
    'stat-pipeline-activo',
  ]);

  /* ── Agrupación para la vista móvil (tabs) ──────────────────────────
    En móvil los 19 KPIs se navegan por grupo para no saturar la vista.
    Solo afecta presentación: los cálculos no cambian. */

  const KPI_GROUPS = [
    { id: 'semana', label: 'Semana' },
    { id: 'vacantes', label: 'Vacantes' },
    { id: 'candidatos', label: 'Candidatos' },
    { id: 'plantilla', label: 'Plantilla' },
    { id: 'bajas', label: 'Bajas' },
  ] as const;

  type KpiGroupId = (typeof KPI_GROUPS)[number]['id'];

  const CARD_GROUP_BY_ID: Record<string, KpiGroupId> = {
    'kpi-ingresos-semana': 'semana',
    'stat-pipeline-citados-hoy': 'semana',
    'stat-pipeline-activo': 'semana',
    'stat-vac-abiertas': 'vacantes',
    'stat-vac-sla': 'vacantes',
    'stat-vac-vencidas': 'vacantes',
    'stat-vac-ttf': 'vacantes',
    'stat-vac-excluidas': 'vacantes',
    'stat-pipeline-total': 'candidatos',
    'stat-pipeline-contratado': 'candidatos',
    'stat-pipeline-rechazado': 'candidatos',
    'stat-autorizada': 'plantilla',
    'stat-real': 'plantilla',
    'stat-vacantes': 'plantilla',
    'stat-cobertura': 'plantilla',
    'kpi-cobertura': 'bajas',
    'kpi-bajas': 'bajas',
    'kpi-ingresos': 'bajas',
    'kpi-solo-induccion': 'bajas',
  };

  /** Cards que abren un modal de detalle. */
  const MODAL_CARD_IDS: ReadonlySet<string> = new Set([
    'kpi-ingresos-semana',
    'stat-pipeline-activo',
    'stat-pipeline-citados-hoy',
    'stat-vac-ttf',
  ]);

  interface VacancyMetrics {
    vencida: boolean;
  }

  function computeVacancyMetrics(v: VacancyRequest): VacancyMetrics {
    const sla = typeof v.dias_sla === 'number' ? v.dias_sla : DEFAULT_VACANCY_SLA_DAYS;
    const end = v.status === 'cubierta' && v.fecha_cubierta ? v.fecha_cubierta : new Date();
    const diasAbierta = v.fecha_apertura ? businessDaysBetween(v.fecha_apertura, end) : 0;
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
    accentColor: string;
    variant?: 'cream' | 'dark';
    origin: string;
  }

  export function KpisPage() {
  const { } = useAuth();
    const { employees, comments, loading: employeesLoading } = useSupabaseData();
    const { candidates, loading: candidatesLoading } = useCandidates();
    const { bajas, loading: bajasLoading } = useBajas();
    const { positions, loading: positionsLoading } = usePositions();

    const loading =
      employeesLoading ||
      candidatesLoading ||
      bajasLoading ||
      positionsLoading;

    // Vacantes derivadas automáticamente de bajas + empleados (mismo modelo
    // que la página de Vacantes), adaptadas a VacancyRequest para los KPIs.
    const vacancies = useMemo(
      () => computeAutoVacancies(bajas, employees).map(autoVacancyToRequest),
      [bajas, employees]
    );

    const reveal = useKpiReveal();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [activeGroup, setActiveGroup] = useState<KpiGroupId>('semana');
    const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
    const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
    const [citedTodayModalOpen, setCitedTodayModalOpen] = useState(false);
    const [ttfHistoryModalOpen, setTtfHistoryModalOpen] = useState(false);
    const [missingModalOpen, setMissingModalOpen] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    /* ── Semana ISO actual + semana anterior ──────────────────── */
    const currentWeek = useMemo(() => {
      const d = new Date();
      d.setDate(d.getDate() + (weekOffset * 7));
      return isoWeekOf(d);
    }, [weekOffset]);
    const currentWeekLabel = useMemo(
      () => formatIsoWeekRange(currentWeek),
      [currentWeek]
    );
    const previousWeek = useMemo(
      () => isoWeekOf(new Date(currentWeek.start.getTime() - 24 * 60 * 60 * 1000)),
      [currentWeek]
    );
    const previousWeekLabel = useMemo(
      () => formatIsoWeekRange(previousWeek),
      [previousWeek]
    );
    const weeklyHires: Employee[] = useMemo(() => {
      const today = localTodayIso();
      return employees
          .filter((e) => isInIsoWeek(e.fecha_ingreso, currentWeek) && String(e.fecha_ingreso).localeCompare(today) <= 0)
          .sort((a, b) => String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)));
    }, [employees, currentWeek]);
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
    const weeklyFutureHires: Employee[] = useMemo(() => {
      const today = localTodayIso();
      return employees
          .filter((e) => isInIsoWeek(e.fecha_ingreso, currentWeek) && String(e.fecha_ingreso).localeCompare(today) > 0)
          .sort((a, b) => String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)));
    }, [employees, currentWeek]);
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
            ttfSum += businessDaysBetween(v.fecha_apertura, v.fecha_cubierta);
            ttfCount += 1;
          }
        }
      }

      const ttfPromedio = ttfCount > 0 ? Math.round(ttfSum / ttfCount) : 0;
      return { abiertas, enSla, vencidas, ttfPromedio, excluidas, cubiertas };
    }, [vacancies]);

    /* ── Candidatos (5) ────────────────────────────────────────── */
    const candidatesInProcess: Candidate[] = useMemo(
      () => candidates.filter(
        (c) => c.status === 'entrega_documentos' || c.status === 'faltan_documentos' || c.status === 'feedback_pendiente'
      ),
      [candidates]
    );
    const candidatesCitadosHoy: Candidate[] = useMemo(() => {
      const today = localTodayIso();
      return candidates.filter(
        (c) => c.status === 'entrevista' && (c.fecha_cita ?? '') === today
      );
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
    const currentPositionCoverage = useMemo(() => {
      return calculatePositionCoverage(employees, comments, positions);
    }, [employees, comments, positions]);

    const dashboardTotals = useMemo(() => {
      const departmentCoverage = calculateDepartmentCoverage(currentPositionCoverage);
      const autorizada = departmentCoverage.reduce((s, d) => s + d.plantilla_autorizada, 0);
      const objetivo = departmentCoverage.reduce((s, d) => s + d.plantilla_objetivo, 0);
      const real = departmentCoverage.reduce((s, d) => s + d.plantilla_real, 0);
      const vacantes = departmentCoverage.reduce((s, d) => s + d.vacantes, 0);
      const cobertura = objetivo > 0 ? Math.round((real / objetivo) * 100) : 0;
      return { autorizada, real, vacantes, cobertura };
    }, [currentPositionCoverage]);

    /* ── Bajas (4) ─────────────────────────────────────────────── */
    const bajasTotals = useMemo(() => {
      const year = currentYearMx();
      const { totals } = computeMonthlyComparison(bajas, employees, year);
      return totals;
    }, [bajas, employees]);

    /* ── Proyección Estratégica ─────────────────────────────────────────────── */
    const todayIso = useMemo(() => localTodayIso(), []);
    const nextWednesdayIso = useMemo(() => getNextWednesdayIso(todayIso), [todayIso]);

    const { dismissedKeys, toggleDismiss } = useDismissedPositions();

    const projectionTotals = useMemo(() => {
      let vacantesPlantilla = 0;
      let vacantesBackup = 0;
      let vacantesStarlite = 0;
      let realTotal = 0;
      let objetivoGlobal = 0;

      for (const pos of currentPositionCoverage) {
        const key = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;
        if (dismissedKeys.has(key)) continue;

        realTotal += pos.plantilla_real;
        objetivoGlobal += pos.plantilla_objetivo;
        
        const urgentes = pos.urgentes ?? 0;
        const backup = pos.backup ?? 0;
        const starliteEmpleados = pos.starlite_empleados || 0;
        
        const vStarlite = Math.max(0, urgentes - starliteEmpleados);
        const starliteSpillover = Math.max(0, starliteEmpleados - urgentes);
        
        const empleadosRegulares = pos.plantilla_real - starliteEmpleados;
        const disponiblesParaRegular = empleadosRegulares + starliteSpillover;
        
        const vPlantilla = Math.max(0, pos.plantilla_autorizada - disponiblesParaRegular);
        const vBackup = Math.max(0, backup - Math.max(0, disponiblesParaRegular - pos.plantilla_autorizada));
        
        vacantesPlantilla += vPlantilla;
        vacantesBackup += vBackup;
        vacantesStarlite += vStarlite;
      }

      // Próximos ingresos en la ventana [hoy, próximo miércoles].
      const upcomingHires = employees
        .filter(e => {
          const ing = String(e.fecha_ingreso);
          return ing > todayIso && ing <= nextWednesdayIso;
        })
        .sort((a, b) =>
          String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso))
        );

      const posState = new Map<string, { disponiblesReg: number; autorizada: number, starliteFaltantes: number }>();
      for (const p of currentPositionCoverage) {
        const key = `${p.area}-${p.seccion || 'none'}-${p.puesto}`;
        if (dismissedKeys.has(key)) continue;

        const urgentes = p.urgentes ?? 0;
        const starliteEmpleados = p.starlite_empleados || 0;
        const starliteFaltantes = Math.max(0, urgentes - starliteEmpleados);
        const starliteSpill = Math.max(0, starliteEmpleados - urgentes);
        const disponiblesReg = p.plantilla_real - starliteEmpleados + starliteSpill;

        posState.set(`${p.area}|${p.seccion}|${p.puesto}`, {
          disponiblesReg,
          autorizada: p.plantilla_autorizada,
          starliteFaltantes,
        });
      }

      let proximosPlantilla = 0;
      let proximosBackup = 0;
      let proximosStarlite = 0;

      for (const e of upcomingHires) {
        const key = `${e.area}|${e.seccion}|${e.puesto}`;
        const pos = posState.get(key);
        if (pos) {
          if (e.is_starlite && pos.starliteFaltantes > 0) {
            proximosStarlite += 1;
            pos.starliteFaltantes -= 1;
          } else {
            if (pos.disponiblesReg < pos.autorizada) {
              proximosPlantilla += 1;
            } else {
              proximosBackup += 1;
            }
            pos.disponiblesReg += 1;
          }
        }
      }

      const proximosIngresos = upcomingHires.length;
      const proyectadoReal = realTotal + proximosIngresos;
      const coberturaProyectada = objetivoGlobal > 0 ? Math.round((proyectadoReal / objetivoGlobal) * 100) : 0;

      return {
        vacantesPlantilla,
        vacantesBackup,
        vacantesStarlite,
        proximosIngresos,
        proximosPlantilla,
        proximosBackup,
        proximosStarlite,
        coberturaProyectada
      };
    }, [currentPositionCoverage, employees, todayIso, nextWednesdayIso, dismissedKeys]);

    /* ── Gráfica Hero (Semana en Curso) ────────────────────────── */
    const heroChartData = useMemo<DailyKpiData[]>(() => {
      const days: DailyKpiData[] = [];
      const fmtDay = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', timeZone: 'America/Mexico_City' });

      const y = currentWeek.start.getUTCFullYear();
      const m = String(currentWeek.start.getUTCMonth() + 1).padStart(2, '0');
      const d = String(currentWeek.start.getUTCDate()).padStart(2, '0');
      const startIso = `${y}-${m}-${d}`;

      for (let i = 0; i < 5; i++) {
        const currentDayIso = addDaysToIso(startIso, i) || '';
        const currentDayDate = new Date(`${currentDayIso}T12:00:00-06:00`);
        let dayName = fmtDay.format(currentDayDate).replace(',', '');
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        const realEmpleadosActuales = employees.filter(e => String(e.fecha_ingreso).localeCompare(currentDayIso) <= 0);
        const realBajasHistoricas = bajas.filter(b =>
          String(b.fecha_ingreso).localeCompare(currentDayIso) <= 0 &&
          String(b.fecha_baja).localeCompare(currentDayIso) > 0
        ).map(b => ({
          ...b,
          turno: b.turno || '1',
          categoria: ''
        } as Employee));

        const mockEmployeesForDay = [...realEmpleadosActuales, ...realBajasHistoricas];
        const coverageForDay = calculatePositionCoverage(mockEmployeesForDay, comments, positions, currentDayIso);

        let vacantesPlantilla = 0;
        let vacantesBackup = 0;
        let realTotal = 0;
        let objetivoGlobal = 0;

        for (const pos of coverageForDay) {
          const key = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;
          if (dismissedKeys.has(key)) continue;

          realTotal += pos.plantilla_real;
          objetivoGlobal += pos.plantilla_objetivo;
          if (pos.plantilla_real < pos.plantilla_autorizada) {
            vacantesPlantilla += (pos.plantilla_autorizada - pos.plantilla_real);
            vacantesBackup += pos.backup;
          } else {
            vacantesBackup += Math.max(0, pos.plantilla_objetivo - pos.plantilla_real);
          }
        }

        const cobertura = objetivoGlobal > 0 ? Math.round((realTotal / objetivoGlobal) * 100) : 0;

        days.push({
          day: dayName,
          dateIso: currentDayIso,
          vacantesPlantilla,
          vacantesBackup,
          cobertura
        });

        // Stop projecting past today if needed, but showing flat lines for the rest of the week is standard
        // unless we want to hide future days completely. We'll show up to Sunday to see the whole week frame.
      }

      return days;
    }, [currentWeek.start, employees, bajas, positions, comments]);

    /* ── KPI list — el orden lo dicta el usuario ───────────────── */
    const cards: KpiDescriptor[] = useMemo(
      () => [
        {
          id: 'kpi-ingresos-semana',
          label: 'Ingresos',
          value: weeklyHires.length,
          accentColor: 'var(--color-primary)',
          origin: 'Bajas',
        },
        {
          id: 'stat-pipeline-citados-hoy',
          label: 'Procesos hoy',
          value: candidateTotals.citadosHoy,
          accentColor: 'var(--color-accent-teal)',
          origin: 'Candidatos',
        },
        {
          id: 'stat-pipeline-activo',
          label: 'Procesos',
          value: candidateTotals.enProceso,
          accentColor: 'var(--color-primary)',
          origin: 'Candidatos',
        },
        {
          id: 'stat-vac-abiertas',
          label: 'Abiertas',
          value: vacancyTotals.abiertas,
          accentColor: 'var(--color-primary)',
          origin: 'Vacantes',
        },
        {
          id: 'stat-vac-sla',
          label: 'En tiempo',
          value: vacancyTotals.enSla,
          accentColor: 'var(--color-accent-teal)',
          origin: 'Vacantes',
        },
        {
          id: 'stat-vac-vencidas',
          label: 'Vencidas',
          value: vacancyTotals.vencidas,
          accentColor: 'var(--color-error)',
          origin: 'Vacantes',
        },
        {
          id: 'stat-vac-ttf',
          label: 'TTF prom. (días)',
          value: vacancyTotals.ttfPromedio,
          accentColor: 'var(--color-ink)',
          origin: 'Vacantes',
        },
        {
          id: 'stat-vac-excluidas',
          label: 'Cubiertas',
          value: vacancyTotals.cubiertas,
          accentColor: 'var(--color-success)',
          origin: 'Vacantes',
        },
        {
          id: 'stat-pipeline-total',
          label: 'Total histórico',
          value: candidateTotals.total,
          accentColor: 'var(--color-ink)',
          origin: 'Candidatos',
        },
        {
          id: 'stat-pipeline-contratado',
          label: 'Contratados',
          value: candidateTotals.contratados,
          accentColor: 'var(--color-accent-teal)',
          origin: 'Candidatos',
        },
        {
          id: 'stat-pipeline-rechazado',
          label: 'Rechazados',
          value: candidateTotals.rechazados,
          accentColor: 'var(--color-error)',
          origin: 'Candidatos',
        },
        {
          id: 'stat-autorizada',
          label: 'Plantilla Autorizada',
          value: dashboardTotals.autorizada,
          accentColor: 'var(--color-ink)',
          origin: 'Dashboard',
        },
        {
          id: 'stat-real',
          label: 'Plantilla Real',
          value: dashboardTotals.real,
          accentColor: 'var(--color-accent-teal)',
          origin: 'Dashboard',
        },
        {
          id: 'stat-vacantes',
          label: 'Vacantes',
          value: dashboardTotals.vacantes,
          accentColor: 'var(--color-error)',
          origin: 'Dashboard',
        },
        {
          id: 'stat-cobertura',
          label: '% Cobertura Global',
          value: `${dashboardTotals.cobertura}%`,
          accentColor: getCoverageColor(dashboardTotals.cobertura),
          variant: 'dark',
          origin: 'Dashboard',
        },
        {
          id: 'kpi-cobertura',
          label: 'Cobertura',
          value: `${bajasTotals.coverturaPct}%`,
          accentColor: 'var(--color-accent-teal)',
          origin: 'Bajas',
        },
        {
          id: 'kpi-bajas',
          label: 'Bajas',
          value: bajasTotals.bajas,
          accentColor: 'var(--color-error)',
          origin: 'Bajas',
        },
        {
          id: 'kpi-ingresos',
          label: 'Ingresos',
          value: bajasTotals.ingresos,
          accentColor: 'var(--color-success)',
          origin: 'Bajas',
        },
        {
          id: 'kpi-solo-induccion',
          label: 'Solo Inducción',
          value: bajasTotals.soloInduccion,
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

    /* ── Vista móvil: cards del grupo activo ───────────────────── */
    const mobileCards = useMemo(
      () => cards.filter((c) => CARD_GROUP_BY_ID[c.id] === activeGroup),
      [cards, activeGroup]
    );

    function openCardModal(id: string) {
      if (id === 'kpi-ingresos-semana') setWeeklyModalOpen(true);
      else if (id === 'stat-pipeline-activo') setCandidatesModalOpen(true);
      else if (id === 'stat-pipeline-citados-hoy') setCitedTodayModalOpen(true);
      else if (id === 'stat-vac-ttf') setTtfHistoryModalOpen(true);
    }

    if (loading) {
      return (
        <main className="kpis-page container" id="page-kpis">
          <section className="kpis-page__hero">
            <div>
              <h1 className="kpis-page__title">Reclutamiento</h1>
            </div>
            {isDesktop && (
              <div className="kpis-page__hero-actions">
                <button type="button" className="btn-secondary" disabled>
                  Incognito
                </button>
              </div>
            )}
          </section>

          {isDesktop && (
            <>
              <section className="kpis-page__chart-section">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', padding: '0 4px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton variant="text" width={280} height={32} />
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Skeleton width={100} height={24} radius={12} />
                      <Skeleton width={50} height={24} radius={12} />
                    </div>
                  </div>
                  <Skeleton width="100%" height={300} radius={12} />
                </div>
              </section>

              <section className="kpis-page__projection-section" aria-hidden="true">
                 <div className="kpis-page__projection-card">
                    <header>
                      <Skeleton variant="text" width={140} height={24} />
                      <Skeleton variant="text" width={100} height={16} />
                    </header>
                    <div className="projection-metrics">
                      <div className="projection-metric">
                        <Skeleton variant="text" width={50} height={32} style={{ marginBottom: 4 }} />
                        <Skeleton variant="text" width={120} height={16} />
                      </div>
                      <div className="projection-metric">
                        <Skeleton variant="text" width={50} height={32} style={{ marginBottom: 4 }} />
                        <Skeleton variant="text" width={120} height={16} />
                      </div>
                      <div className="projection-metric">
                        <Skeleton variant="text" width={60} height={32} style={{ marginBottom: 4 }} />
                        <Skeleton variant="text" width={120} height={16} />
                      </div>
                    </div>
                 </div>

                 <div className="kpis-page__projection-card projection-card--future">
                    <header>
                      <Skeleton variant="text" width={160} height={24} />
                      <Skeleton variant="text" width={110} height={16} />
                    </header>
                    <div className="projection-metrics">
                      <div className="projection-metric">
                        <Skeleton variant="text" width={40} height={32} style={{ marginBottom: 4 }} />
                        <Skeleton variant="text" width={130} height={16} />
                      </div>
                    </div>
                 </div>
              </section>
            </>
          )}

          <KpiGridSkeleton count={isDesktop ? cards.length : 4} />
        </main>
      );
    }

    return (
      <main className="kpis-page container" id="page-kpis">

        <section className="kpis-page__hero">
          <div>
            <h1 className="kpis-page__title">Reclutamiento</h1>
          </div>
          {isDesktop && (
            <div className="kpis-page__hero-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={reveal.hideAll}
                disabled={revealedCount === 0}
                title="Volver a ocultar todas las cards"
              >
                Ocultar
              </button>
            </div>
          )}
        </section>

        {isDesktop ? (
          <>
            <Reveal as="section" className="kpis-page__chart-section">
              <KpiHeroChart
                data={heroChartData}
                onClick={() => setMissingModalOpen(true)}
                onPrevWeek={() => setWeekOffset(prev => prev - 1)}
                onNextWeek={() => setWeekOffset(prev => prev + 1)}
                weekNumber={currentWeek.week}
              />
            </Reveal>

            <section className="kpis-page__projection-section" aria-label="Proyección Estratégica">
               <div className="kpis-page__projection-card">
                  <header>
                    <h3 className="projection-title">Estado Actual</h3>
                    <span className="projection-date">Hoy, {formatProjectionDate(todayIso)}</span>
                  </header>
                  <div className="projection-metrics">
                    <div className="projection-metric">
                      <span className="projection-value text-error"><AnimatedNumber value={projectionTotals.vacantesPlantilla} /></span>
                      <span className="projection-label">Vacantes Plantilla</span>
                    </div>
                    <div className="projection-metric">
                      <span className="projection-value text-warning"><AnimatedNumber value={projectionTotals.vacantesBackup} /></span>
                      <span className="projection-label">Vacantes Backup</span>
                    </div>
                    <div className="projection-metric">
                      <span className="projection-value text-starlite" style={{ color: '#d97706' }}><AnimatedNumber value={projectionTotals.vacantesStarlite} /></span>
                      <span className="projection-label">Vacantes Starlite</span>
                    </div>
                    <div className="projection-metric">
                      <span className="projection-value text-primary">
                        <AnimatedNumber
                          value={heroChartData.length > 0 ? Math.round(heroChartData.reduce((s, d) => s + d.cobertura, 0) / heroChartData.length) : 0}
                        />%
                      </span>
                      <span className="projection-label">Cobertura Prom.</span>
                    </div>
                  </div>
               </div>

               <div className="kpis-page__projection-card projection-card--future">
                  <header>
                    <h3 className="projection-title">Proyección Semanal</h3>
                    <span className="projection-date">Ingreso: {formatProjectionDate(nextWednesdayIso)}</span>
                  </header>
                  <div className="projection-metrics">
                    <div className="projection-metric">
                      <span className="projection-value text-success"><AnimatedNumber value={projectionTotals.proximosIngresos} prefix="+" /></span>
                      <span className="projection-label">Próximos Ingresos</span>
                      {projectionTotals.proximosIngresos > 0 && (
                        <span className="projection-sublabel">
                          {projectionTotals.proximosPlantilla > 0 && (
                            <span className="projection-chip projection-chip--plantilla">
                              {projectionTotals.proximosPlantilla} plantilla
                            </span>
                          )}
                          {projectionTotals.proximosBackup > 0 && (
                            <span className="projection-chip projection-chip--backup">
                              {projectionTotals.proximosBackup} backup
                            </span>
                          )}
                          {projectionTotals.proximosStarlite > 0 && (
                            <span className="projection-chip projection-chip--starlite">
                              ★ {projectionTotals.proximosStarlite} starlite
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="projection-metric">
                      <span className="projection-value text-primary"><AnimatedNumber value={projectionTotals.coberturaProyectada} suffix="%" /></span>
                      <span className="projection-label">Avance Proyectado</span>
                    </div>
                  </div>
               </div>
            </section>

            <section
              className="kpis-page__grid"
              aria-label="KPIs consolidados"
            >
              {cards.map((card, index) => {
                const isAlwaysVisible = ALWAYS_VISIBLE_IDS.has(card.id);
                const revealed = isAlwaysVisible || reveal.isRevealed(card.id);
                const isWeeklyCard = card.id === 'kpi-ingresos-semana';
                const isCitedTodayCard = card.id === 'stat-pipeline-citados-hoy';
                const isTtfCard = card.id === 'stat-vac-ttf';
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
                    style={{ '--kpi-stack-i': index } as React.CSSProperties}
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
                        <button
                          type="button"
                          className="kpis-page__detail-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCardModal(card.id);
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-label={
                            isWeeklyCard
                              ? 'Ver puestos contratados esta semana'
                              : isCitedTodayCard
                              ? 'Ver candidatos citados hoy'
                              : isTtfCard
                              ? 'Ver histórico mensual de TTF'
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
          </>
        ) : (
          <>
            <nav
              className="kpis-page__tabs"
              aria-label="Grupos de KPIs"
              data-testid="kpis-mobile-tabs"
            >
              {KPI_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`kpis-page__tab${
                    activeGroup === group.id ? ' kpis-page__tab--active' : ''
                  }`}
                  aria-pressed={activeGroup === group.id}
                  onClick={() => setActiveGroup(group.id)}
                  data-testid={`kpis-tab-${group.id}`}
                >
                  {group.label}
                </button>
              ))}
            </nav>

            <motion.section
              key={activeGroup}
              className="kpis-page__m-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              aria-label={`KPIs de ${
                KPI_GROUPS.find((g) => g.id === activeGroup)?.label ?? activeGroup
              }`}
              data-testid="kpis-mobile-grid"
            >
              {mobileCards.map((card) => {
                const hasModal = MODAL_CARD_IDS.has(card.id);
                return (
                  <motion.div
                    key={card.id}
                    variants={staggerItem}
                    className="kpis-page__m-card"
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
                      <button
                        type="button"
                        className="kpis-page__m-detail"
                        onClick={() => openCardModal(card.id)}
                        aria-label={`Ver detalle de ${card.label}`}
                        data-testid={`kpis-mobile-detail-${card.id}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </motion.section>


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

        <TtfHistoryModal
          isOpen={ttfHistoryModalOpen}
          onClose={() => setTtfHistoryModalOpen(false)}
          vacancies={vacancies}
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
          futureHires={weeklyFutureHires}
        />

        <MissingPositionsModal
          isOpen={missingModalOpen}
          onClose={() => setMissingModalOpen(false)}
          coverage={currentPositionCoverage}
          vacancies={vacancies}
          /* Pasamos TODOS los candidatos: el modal filtra internamente
             por estados activos (entrevista, entrega_documentos,
             faltan_documentos, feedback_pendiente). */
          candidates={candidates}
        />
      </main>
    );
  }
