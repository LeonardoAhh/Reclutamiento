import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Check,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
  Calendar,
  Clock,
  ChevronDown,
  SlidersHorizontal,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useBajas } from '@/hooks/useBajas';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { usePositions } from '@/lib/positions';
import { calculatePositionCoverage, normalizeString, normalizePuesto } from '@/lib/utils';
import { computeAutoVacancies, type AutoVacancy } from '@/lib/autoVacancies';
import { notifyResult, sileo } from '@/lib/notify';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import { VacancyStatusBadge } from '@/components/ui/VacancyStatusBadge';
import { VacancyTypeBadge } from '@/components/ui/VacancyTypeBadge';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { formatShortDate, localTodayIso } from '@/lib/dates';
import { PositionSettingsWizard } from '@/components/ui/PositionSettingsWizard';
import { EASE_OUT } from '@/lib/motion';
import './Pipeline.css';
import './Vacantes.css';

type StatusFilter = 'todas' | 'abierta' | 'cubierta';
type VacancyTypeFilter = 'todos' | 'autorizado' | 'backup';

const RECLUTADOR_OPTIONS = [
  { value: '', label: 'Sin asignar' },
  ...RECLUTADORES_ACTIVOS.map((r) => ({
    value: r,
    label: r.charAt(0) + r.slice(1).toLowerCase(),
  })),
];

export function Vacantes() {
  const {
    bajas,
    loading: bajasLoading,
    setBajaReclutador,
    marcarCubierta,
    desmarcarCubierta,
  } = useBajas();
  const { employees, comments, loading: empLoading } = useSupabaseData();
  const { positions, customPositions, positionSettings, deletePosition, upsertPositionSetting, loading: positionsLoading } = usePositions();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [typeFilter, setTypeFilter] = useState<VacancyTypeFilter>('todos');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('vac_sidebar_collapsed') === '1'
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vac_sidebar_collapsed', next ? '1' : '0');
      }
      return next;
    });
  };

  const loading = bajasLoading || empLoading || positionsLoading;

  const vacancies = useMemo(
    () => computeAutoVacancies(bajas, employees, positions),
    [bajas, employees, positions]
  );

  // 8 KPIs (Modelo B — plantilla real): cada métrica dividida en
  // AUTORIZADO (plantilla autorizada A) vs BACKUP (buffer B definido en código).
  // Ocupados/vacantes/cobertura se calculan por puesto contra los empleados reales.
  const split = useMemo(() => {
    const cov = calculatePositionCoverage(employees, comments, positions);
    let autorizada = 0;
    let backup = 0;
    let ocupadosAut = 0;
    let ocupadosBackup = 0;
    for (const p of cov) {
      autorizada += p.plantilla_autorizada;
      backup += p.backup;
      ocupadosAut += Math.min(p.plantilla_real, p.plantilla_autorizada);
      ocupadosBackup += p.excedente_backup; // ocupados dentro de la banda backup
    }
    const vacAut = Math.max(0, autorizada - ocupadosAut);
    const vacBackup = Math.max(0, backup - ocupadosBackup);
    const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);
    return {
      plantilla: { autorizado: autorizada, backup },
      ocupados: { autorizado: ocupadosAut, backup: ocupadosBackup },
      vacantes: { autorizado: vacAut, backup: vacBackup },
      cobertura: { autorizado: pct(ocupadosAut, autorizada), backup: pct(ocupadosBackup, backup) },
    };
  }, [employees, comments, positions]);

  const kpiRows = useMemo(
    () =>
      [
        { id: 'plantilla', label: 'Plantilla', pair: split.plantilla },
        { id: 'ocupados', label: 'Ocupados', pair: split.ocupados, tone: 'done' as const },
        { id: 'vacantes', label: 'Vacantes', pair: split.vacantes, tone: 'open' as const },
        { id: 'cobertura', label: 'Cobertura', pair: split.cobertura, suffix: '%' },
      ] as const,
    [split]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vacancies
      .filter((v) => statusFilter === 'todas' || v.status === statusFilter)
      .filter((v) => typeFilter === 'todos' || v.vacancyType === typeFilter)
      .filter((v) => {
        if (!q) return true;
        const haystack = [
          v.puesto,
          v.area,
          v.seccion,
          v.baja?.nombre,
          v.baja?.num_empleado,
          v.coveredBy?.nombre,
          v.reclutador,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      // 1º Tipo: Plantilla Autorizada primero, Backup después.
      // 2º Dentro del mismo tipo: abiertas antes que cubiertas.
      // 3º Dentro del mismo tipo y estado: más urgentes arriba (días desc).
      .sort((a, b) => {
        if (a.vacancyType !== b.vacancyType)
          return a.vacancyType === 'autorizado' ? -1 : 1;
        if (a.status !== b.status) return a.status === 'abierta' ? -1 : 1;
        return b.dias - a.dias;
      });
  }, [vacancies, searchTerm, statusFilter, typeFilter]);

  async function handleReclutador(v: AutoVacancy, value: string) {
    if (!v.baja) return; // vacante estructural: sin baja a la cual asignar
    await notifyResult(setBajaReclutador(v.baja.num_empleado, value || null), {
      success: value ? 'Reclutador asignado' : 'Reclutador quitado',
      error: 'No se pudo guardar el reclutador',
    });
  }

  async function handleToggleManual(v: AutoVacancy) {
    if (!v.baja) return; // vacante estructural: no se puede cubrir a mano
    if (v.coberturaTipo === 'manual') {
      const res = await desmarcarCubierta(v.baja.num_empleado);
      if (res.ok) sileo.info({ title: 'Vacante reabierta' });
      else sileo.error({ title: 'No se pudo reabrir la vacante' });
    } else {
      const res = await marcarCubierta(v.baja.num_empleado, localTodayIso());
      if (res.ok) sileo.success({ title: 'Vacante cubierta' });
      else sileo.error({ title: 'No se pudo marcar la vacante' });
    }
  }

  /** Devuelve la posición custom (creada desde la UI) que coincide con la vacante, si existe. */
  function findCustomPosition(v: AutoVacancy) {
    const key = `${normalizeString(v.area)}::${normalizeString(v.seccion)}::${normalizePuesto(v.puesto)}`;
    return customPositions.find(
      (p) => `${normalizeString(p.area)}::${normalizeString(p.seccion)}::${normalizePuesto(p.puesto)}` === key
    );
  }

  /** ¿Se puede quitar esta vacante desde la página? (estructural: custom o backup) */
  function canRemoveStructural(v: AutoVacancy): boolean {
    if (v.baja) return false; // las vacantes por baja se gestionan con cobertura, no se borran
    return Boolean(findCustomPosition(v)) || v.vacancyType === 'backup';
  }

  async function handleRemoveStructural(v: AutoVacancy) {
    if (v.baja) return;
    const ubicacion = `${v.area}${v.seccion ? ` · ${v.seccion}` : ''}`;
    const cp = findCustomPosition(v);

    // Caso 1: posición personalizada → se elimina por completo (BD + local).
    if (cp) {
      if (
        !window.confirm(
          `¿Eliminar la posición personalizada "${v.puesto}" (${ubicacion})?\n\nEsta acción no se puede deshacer.`
        )
      ) {
        return;
      }
      await notifyResult(deletePosition({ area: cp.area, seccion: cp.seccion, puesto: cp.puesto }), {
        success: 'Posición personalizada eliminada',
        error: 'No se pudo eliminar la posición',
      });
      return;
    }

    // Caso 2: vacante de backup del catálogo estático → se pone el backup en 0
    // (override reversible desde "Configurar plantilla/backup").
    if (v.vacancyType !== 'backup') return;
    if (
      !window.confirm(
        `Esta es una vacante de backup del catálogo "${v.puesto}" (${ubicacion}).\n\n¿Quitarla? Su backup se pondrá en 0 (reversible desde "Configurar plantilla/backup").`
      )
    ) {
      return;
    }
    const key = `${normalizeString(v.area)}::${normalizeString(v.seccion)}::${normalizePuesto(v.puesto)}`;
    const cur = positionSettings.find(
      (s) => `${normalizeString(s.area)}::${normalizeString(s.seccion)}::${normalizePuesto(s.puesto)}` === key
    );
    await notifyResult(
      upsertPositionSetting({
        area: v.area,
        seccion: v.seccion,
        puesto: v.puesto,
        plantilla_autorizada: cur?.plantilla_autorizada ?? null,
        backup: 0,
        urgentes: cur?.urgentes ?? 0,
        notas: cur?.notas ?? null,
        updated_by: profile?.username ?? null,
      }),
      {
        success: 'Vacante de backup quitada (backup = 0)',
        error: 'No se pudo actualizar el backup',
      }
    );
  }

  if (loading) {
    return (
      <main className="pipeline container">
        <section className="pipeline__hero">
          <h1>Vacantes</h1>
        </section>
        <section className="pipeline__controls">
          <Skeleton height={40} radius="var(--rounded-md)" style={{ flex: '1 1 260px' }} />
        </section>
        <SkeletonTable rows={8} columns={['30%', '16%', '24%', '16%', '14%']} />
      </main>
    );
  }

  return (
    <main className="pipeline vacantes-page">
      {/* ── Hero ── */}
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Vacantes</h1>
        </div>
        {isAdmin && (
          <div className="pipeline__hero-actions">
            <button
              type="button"
              className="btn-secondary vacantes__config-btn"
              onClick={() => setWizardOpen(true)}
              data-testid="vac-config-btn"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {isAdmin && (
        <PositionSettingsWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      )}

      <div className="pipeline__layout" data-collapsed={sidebarCollapsed ? 'true' : undefined}>
        <aside className="pipeline__sidebar" aria-hidden={sidebarCollapsed}>
          {/* ── Resumen: vacantes por tipo (autorizado vs backup) ── */}
          <section className="vacantes__split" aria-label="Resumen de vacantes por tipo">
        <div className="vacantes__split-head" role="row">
          <span className="vacantes__split-corner" />
          <span className="vacantes__split-colhead vacantes__split-colhead--aut">Autorizado</span>
          <span className="vacantes__split-colhead vacantes__split-colhead--bak">Backup</span>
        </div>
        {kpiRows.map((row) => (
          <div
            key={row.id}
            className={`vacantes__split-row${
              'tone' in row && row.tone ? ` vacantes__split-row--${row.tone}` : ''
            }`}
            role="row"
            data-testid={`vac-split-${row.id}`}
          >
            <span className="vacantes__split-label">{row.label}</span>
            <span className="vacantes__split-cell" data-testid={`vac-split-${row.id}-aut`}>
              <AnimatedNumber value={row.pair.autorizado} suffix={'suffix' in row ? row.suffix : ''} />
            </span>
            <span className="vacantes__split-cell" data-testid={`vac-split-${row.id}-bak`}>
              <AnimatedNumber value={row.pair.backup} suffix={'suffix' in row ? row.suffix : ''} />
            </span>
          </div>
        ))}
      </section>

      {/* Sección de filtros minimalista: Estado + Tipo */}
      <section className="vacantes__filters" aria-label="Filtros de vacantes">
        {/* Filtro de Estado */}
        <div className="vacantes__filter-group">
          <label className="vacantes__filter-label">Estado</label>
          <div className="vacantes__filter-options" role="tablist">
            {([
              { id: 'todas', label: 'Todas' },
              { id: 'abierta', label: 'Abiertas' },
              { id: 'cubierta', label: 'Cubiertas' },
            ] as const).map((s) => (
              <button
                key={`status-${s.id}`}
                type="button"
                role="tab"
                aria-selected={statusFilter === s.id}
                className={`vacantes__filter-btn${statusFilter === s.id ? ' vacantes__filter-btn--active' : ''}`}
                onClick={() => setStatusFilter(s.id)}
                data-testid={`vac-filter-status-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Tipo */}
        <div className="vacantes__filter-group">
          <label className="vacantes__filter-label">Tipo</label>
          <div className="vacantes__filter-options" role="tablist">
            {([
              { id: 'todos', label: 'Todos' },
              { id: 'autorizado', label: 'Plantilla' },
              { id: 'backup', label: 'Backup' },
            ] as const).map((t) => (
              <button
                key={`type-${t.id}`}
                type="button"
                role="tab"
                aria-selected={typeFilter === t.id}
                className={`vacantes__filter-btn${typeFilter === t.id ? ' vacantes__filter-btn--active' : ''}`}
                onClick={() => setTypeFilter(t.id as VacancyTypeFilter)}
                data-testid={`vac-filter-type-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>
        </aside>

        <div className="pipeline__content">
          {/* ── Toggle sidebar ── */}
          <button
            type="button"
            className="vacantes__sidebar-toggle"
            onClick={toggleSidebar}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Mostrar panel de KPIs' : 'Ocultar panel de KPIs'}
            data-testid="vac-sidebar-toggle"
          >
            {sidebarCollapsed
              ? <PanelLeftOpen size={16} aria-hidden="true" />
              : <PanelLeftClose size={16} aria-hidden="true" />}
            <span>{sidebarCollapsed ? 'KPIs' : 'Ocultar'}</span>
          </button>

          {/* ── Controles (búsqueda) ── */}
          <section className="pipeline__controls">
            <div className="pipeline__search">
              <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
              <label htmlFor="vac-search" className="sr-only">
                Buscar vacante
              </label>
              <input
                id="vac-search"
                type="text"
                placeholder="Buscar por puesto, área, persona, reclutador…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pipeline__search-input"
                autoComplete="off"
                data-testid="vac-search-input"
              />
            </div>
            <span className="pipeline__count">
              {filtered.length} de {vacancies.length}
            </span>
          </section>

          {/* ── Lista ── */}
      {filtered.length === 0 ? (
        <section className="pipeline__empty">
          <div className="pipeline__empty-icon" aria-hidden="true">
            <ClipboardList size={28} />
          </div>
          <h2 className="pipeline__empty-title">
            {vacancies.length === 0
              ? 'No hay bajas registradas todavía'
              : 'Sin vacantes que coincidan'}
          </h2>
          <p className="pipeline__empty-lead">
            {vacancies.length === 0
              ? 'Importa las bajas para generar las vacantes automáticamente.'
              : 'Prueba con otro filtro o término de búsqueda.'}
          </p>
        </section>
      ) : (
        <>
          {/* Mobile: tarjetas */}
          <section className="vacantes__cards" aria-label="Lista de vacantes">
            {filtered.map((v) => (
              <VacancyCard
                key={v.key}
                v={v}
                onReclutador={(val) => handleReclutador(v, val)}
                onToggleManual={() => handleToggleManual(v)}
                canDelete={canRemoveStructural(v)}
                onDelete={() => handleRemoveStructural(v)}
              />
            ))}
          </section>

          {/* Desktop: tabla */}
          <section className="pipeline__table-wrap vacantes__table" aria-label="Tabla de vacantes">
            <table className="pipeline__table" aria-labelledby="vac-table-caption">
              <caption id="vac-table-caption" className="sr-only">
                Listado de vacantes — {filtered.length} de {vacancies.length}
              </caption>
              <colgroup>
                <col className="vac-col--baja" />
                <col className="vac-col--puesto" />
                <col className="vac-col--area" />
                <col className="vac-col--tipo" />
                <col className="vac-col--sla" />
                <col className="vac-col--reclutador" />
                <col className="vac-col--accion" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" id="vac-th-baja">Baja</th>
                  <th scope="col" id="vac-th-puesto">Puesto</th>
                  <th scope="col" id="vac-th-area">Área</th>
                  <th scope="col" id="vac-th-tipo">Tipo</th>
                  <th scope="col" id="vac-th-sla" title="Días hábiles desde la baja · SLA 12 días">
                    Días · SLA
                  </th>
                  <th scope="col" id="vac-th-reclutador">Reclutador</th>
                  <th scope="col" id="vac-th-accion" className="pipeline__th--actions">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.key}
                    className={v.status === 'abierta' ? 'vacantes__row--overdue' : ''}
                  >
                    {/* BAJA — orden: #num → nombre → fecha */}
                    <td headers="vac-th-baja">
                      {v.baja ? (
                        <>
                          <div className="vacantes__cell-emp">#{v.baja.num_empleado}</div>
                          <div className="pipeline__area">{v.baja.nombre}</div>
                          <div className="vacantes__cell-strong">{formatShortDate(v.fechaBaja)}</div>
                        </>
                      ) : (
                        <>
                          <div className="vacantes__cell-strong">—</div>
                          <div className="pipeline__area">Vacante estructural</div>
                        </>
                      )}
                    </td>

                    {/* PUESTO */}
                    <td headers="vac-th-puesto">
                      <div className="pipeline__puesto">{v.puesto}</div>
                    </td>

                    {/* ÁREA */}
                    <td headers="vac-th-area">
                      <div className="pipeline__area">
                        {v.area}
                        {v.seccion ? ` · ${v.seccion}` : ''}
                      </div>
                    </td>

                    {/* TIPO */}
                    <td headers="vac-th-tipo">
                      <VacancyTypeBadge type={v.vacancyType} />
                    </td>

                    {/* DÍAS · SLA */}
                    <td headers="vac-th-sla">
                      <div className="vacantes__sla-cell">
                        {v.baja ? (
                          <>
                            <span
                              className={`vacantes__sla ${
                                v.status === 'cubierta'
                                  ? 'vacantes__sla--done'
                                  : 'vacantes__sla--overdue'
                              }`}
                            >
                              {v.dias}/{v.slaDays}
                            </span>
                            <SlaBadge v={v} />
                          </>
                        ) : (
                          <span className="vacantes__sla">—</span>
                        )}
                      </div>
                    </td>

                    {/* RECLUTADOR */}
                    <td headers="vac-th-reclutador">
                      <CustomSelect
                        id={`vac-rec-${v.key}`}
                        value={v.reclutador ?? ''}
                        onChange={(val) => handleReclutador(v, val)}
                        options={RECLUTADOR_OPTIONS}
                        aria-label={`Reclutador para ${v.puesto}`}
                        disabled={!v.baja}
                      />
                    </td>

                    {/* ACCIONES */}
                    <td headers="vac-th-accion" className="pipeline__cell-actions">
                      <button
                        type="button"
                        className="pipeline__icon-btn"
                        onClick={() => handleToggleManual(v)}
                        disabled={!v.baja}
                        title={
                          !v.baja
                            ? 'Vacante estructural (sin baja)'
                            : v.coberturaTipo === 'manual'
                              ? 'Reabrir vacante'
                              : 'Marcar cubierta a mano (interna)'
                        }
                        aria-label={
                          v.coberturaTipo === 'manual'
                            ? 'Reabrir vacante'
                            : 'Marcar cubierta a mano'
                        }
                        data-testid={`vac-manual-${v.key}`}
                      >
                        {v.coberturaTipo === 'manual' ? (
                          <ArrowRightLeft size={16} aria-hidden="true" />
                        ) : (
                          <CheckCircle2 size={16} aria-hidden="true" />
                        )}
                      </button>
                      {canRemoveStructural(v) && (
                        <button
                          type="button"
                          className="pipeline__icon-btn vacantes__del-btn"
                          onClick={() => handleRemoveStructural(v)}
                          title={
                            findCustomPosition(v)
                              ? 'Eliminar posición personalizada'
                              : 'Quitar vacante de backup'
                          }
                          aria-label={
                            findCustomPosition(v)
                              ? `Eliminar posición personalizada ${v.puesto}`
                              : `Quitar vacante de backup ${v.puesto}`
                          }
                          data-testid={`vac-delete-${v.key}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
        </div>
      </div>
    </main>
  );
}

/** Badge minimalista de cumplimiento de SLA (12 días hábiles). */
function SlaBadge({ v }: { v: AutoVacancy }) {
  const covered = v.status === 'cubierta';
  let tone: 'ok' | 'warn' | 'bad' | 'neutral';
  let label: string;
  let Icon: typeof Check;
  if (covered) {
    tone = v.enTiempo ? 'ok' : 'warn';
    label = v.enTiempo ? 'En tiempo' : 'Tarde';
    Icon = v.enTiempo ? Check : AlertTriangle;
  } else {
    tone = v.enTiempo ? 'neutral' : 'bad';
    label = v.enTiempo ? 'En SLA' : 'Vencida';
    Icon = v.enTiempo ? Clock : AlertTriangle;
  }
  return (
    <span
      className={`vacantes__sla-badge vacantes__sla-badge--${tone}`}
      title={`${v.dias} de ${v.slaDays} días hábiles`}
      data-testid={`vac-sla-${v.key}`}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Texto de cobertura: quién la cubrió y cómo. */
function CoverageInfo({ v }: { v: AutoVacancy }) {
  if (v.status === 'abierta') {
    return <span className="vacantes__cover vacantes__cover--pending">Pendiente</span>;
  }
  if (v.coberturaTipo === 'manual') {
    return (
      <span className="vacantes__cover" title={v.baja?.cubierta_nota ?? 'Cobertura interna'}>
        <ArrowRightLeft size={13} aria-hidden="true" />
        Interna{v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}
      </span>
    );
  }
  if (!v.coveredBy) {
    // Baja absorbida: el puesto ya está cubierto por la plantilla vigente.
    return (
      <span className="vacantes__cover" title="Puesto cubierto por la plantilla actual">
        <UserPlus size={13} aria-hidden="true" />
        Plantilla completa
      </span>
    );
  }
  return (
    <span className="vacantes__cover" title={`Ingreso: ${v.coveredBy?.fecha_ingreso ?? ''}`}>
      <UserPlus size={13} aria-hidden="true" />
      {v.coveredBy?.nombre}
      {v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}
    </span>
  );
}

/** Tarjeta mobile expandible (acordeón inline) de una vacante automática. */
function VacancyCard({
  v,
  onReclutador,
  onToggleManual,
  canDelete,
  onDelete,
}: {
  v: AutoVacancy;
  onReclutador: (value: string) => void;
  onToggleManual: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const cardCls = [
    'vacantes__card',
    v.status === 'abierta' ? 'vacantes__card--overdue' : '',
    open ? 'vacantes__card--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const coberturaText =
    v.status === 'abierta'
      ? v.baja
        ? 'Sin cubrir'
        : 'Vacante estructural'
      : v.coberturaTipo === 'manual'
        ? `Cobertura interna${v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}`
        : v.coveredBy
          ? `${v.coveredBy.nombre}${v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}`
          : 'Plantilla completa';

  return (
    <article className={cardCls} aria-label={`Vacante de ${v.puesto}`}>
      {/* Cabecera: tap para expandir */}
      <button
        type="button"
        className="vacantes__card-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`vac-card-toggle-${v.key}`}
      >
        <div className="vacantes__card-title">
          <div className="vacantes__card-puesto">{v.puesto}</div>
          <div className="vacantes__card-sub">
            {v.area}
            {v.seccion ? ` · ${v.seccion}` : ''}
          </div>
        </div>
        <div className="vacantes__card-head-right">
          <VacancyStatusBadge status={v.status} />
          <span
            className={`vacantes__sla ${
              v.status === 'cubierta' ? 'vacantes__sla--done' : 'vacantes__sla--overdue'
            }`}
          >
            {v.baja ? `${v.dias}d` : '—'}
          </span>
          <ChevronDown
            size={18}
            className={`vacantes__chevron${open ? ' vacantes__chevron--open' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Fila resumen siempre visible: cumplimiento de SLA + días + tipo */}
      <div className="vacantes__card-quick">
        <VacancyTypeBadge type={v.vacancyType} />
        {v.baja ? (
          <>
            <SlaBadge v={v} />
            <span className="vacantes__quick-days">
              {v.dias}/{v.slaDays} días
            </span>
          </>
        ) : (
          <span className="vacantes__quick-days">Sin baja asociada</span>
        )}
      </div>

      {/* Detalle inline (acordeón) */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            className="vacantes__card-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
          >
            <div className="vacantes__detail-inner">
              <div className="vacantes__detail-row">
                <UserPlus size={15} aria-hidden="true" />
                <span className="vacantes__detail-label">Cobertura</span>
                <span className="vacantes__detail-value">{coberturaText}</span>
              </div>
              <div className="vacantes__detail-row">
                <Calendar size={15} aria-hidden="true" />
                <span className="vacantes__detail-label">Baja</span>
                <span className="vacantes__detail-value">
                  {v.baja
                    ? `${v.baja.nombre} (#${v.baja.num_empleado}) · ${formatShortDate(v.fechaBaja)}`
                    : 'Sin baja asociada'}
                </span>
              </div>
              <div className="vacantes__detail-row">
                <Clock size={15} aria-hidden="true" />
                <span className="vacantes__detail-label">Tiempo</span>
                <span className="vacantes__detail-value">
                  {v.baja
                    ? `${v.dias} días ${v.status === 'cubierta' ? 'para cubrir' : 'abierta'}`
                    : '—'}
                </span>
              </div>

              <div className="vacantes__detail-actions">
                <CustomSelect
                  id={`vac-rec-card-${v.key}`}
                  value={v.reclutador ?? ''}
                  onChange={onReclutador}
                  options={RECLUTADOR_OPTIONS}
                  aria-label={`Reclutador para ${v.puesto}`}
                  disabled={!v.baja}
                />
                <button
                  type="button"
                  className="pipeline__icon-btn"
                  onClick={onToggleManual}
                  disabled={!v.baja}
                  title={v.coberturaTipo === 'manual' ? 'Reabrir vacante' : 'Marcar cubierta a mano'}
                  aria-label={v.coberturaTipo === 'manual' ? 'Reabrir vacante' : 'Marcar cubierta a mano'}
                  data-testid={`vac-manual-card-${v.key}`}
                >
                  {v.coberturaTipo === 'manual' ? (
                    <ArrowRightLeft size={16} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={16} aria-hidden="true" />
                  )}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="pipeline__icon-btn vacantes__del-btn"
                    onClick={onDelete}
                    title="Quitar vacante"
                    aria-label={`Quitar vacante ${v.puesto}`}
                    data-testid={`vac-delete-card-${v.key}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
