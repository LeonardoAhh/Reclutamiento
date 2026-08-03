import { useMemo, useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Modal } from '@/components/ui/Modal';
import { useBajas } from '@/hooks/useBajas';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { usePositions } from '@/lib/positions';
import { calculatePositionCoverage, normalizeString, normalizePuesto, toTitleCase } from '@/lib/utils';
import { computeAutoVacancies, type AutoVacancy } from '@/lib/autoVacancies';
import { notifyResult, sileo } from '@/lib/notify';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import { VacancyStatusBadge } from '@/components/ui/VacancyStatusBadge';
import { VacancyTypeBadge } from '@/components/ui/VacancyTypeBadge';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ReclutadorBadge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { formatShortDate, localTodayIso, formatMonthLabel } from '@/lib/dates';
import { PositionSettingsWizard } from '@/components/ui/PositionSettingsWizard';
import { EASE_OUT } from '@/lib/motion';
import './Pipeline.css';
import './Vacantes.css';

type StatusFilter = 'todas' | 'abierta' | 'cubierta';
type VacancyTypeFilter = 'todos' | 'autorizado' | 'backup';

const RECLUTADOR_OPTIONS = [
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutoVacancy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<AutoVacancy | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);

  const loading = bajasLoading || empLoading || positionsLoading;

  const vacancies = useMemo(
    () => computeAutoVacancies(bajas, employees, positions),
    [bajas, employees, positions]
  );

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
      ocupadosBackup += p.excedente_backup;
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
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'abierta' ? -1 : 1;
        if (a.vacancyType !== b.vacancyType)
          return a.vacancyType === 'autorizado' ? -1 : 1;
        return b.dias - a.dias;
      });
  }, [vacancies, searchTerm, statusFilter, typeFilter]);

  const vacanciesByMonth = useMemo(() => {
    const counts: Record<string, { total: number; abierta: number; cubierta: number; puestos: Record<string, { abierta: number; cubierta: number }> }> = {};
    for (const v of vacancies) {
      const isStructural = !v.baja || !v.fechaBaja;
      const month = isStructural ? 'Estructurales' : v.fechaBaja.slice(0, 7);
      if (!counts[month]) counts[month] = { total: 0, abierta: 0, cubierta: 0, puestos: {} };
      counts[month].total++;
      if (v.status === 'abierta') counts[month].abierta++;
      else counts[month].cubierta++;
      
      // Normalize puesto name to group categories/shifts (e.g., "Operador de Máquina D" -> "Operador de Máquina")
      const rawPuesto = v.puesto.trim();
      const normalizedPuesto = rawPuesto.replace(/\s+[A-Za-z]$/, '').trim();
      const puestoKey = toTitleCase(normalizedPuesto);
      if (!counts[month].puestos[puestoKey]) counts[month].puestos[puestoKey] = { abierta: 0, cubierta: 0 };
      if (v.status === 'abierta') counts[month].puestos[puestoKey].abierta++;
      else counts[month].puestos[puestoKey].cubierta++;
    }
    return Object.entries(counts).sort((a, b) => {
      if (a[0] === 'Estructurales') return 1;
      if (b[0] === 'Estructurales') return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [vacancies]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  async function handleReclutador(v: AutoVacancy, value: string) {
    if (!v.baja) return;
    await notifyResult(setBajaReclutador(v.baja.num_empleado, value || null), {
      success: value ? 'Reclutador asignado' : 'Reclutador quitado',
      error: 'No se pudo guardar el reclutador',
    });
  }

  async function confirmToggleManual() {
    if (!toggleTarget || isToggling || !toggleTarget.baja) return;
    setIsToggling(true);

    try {
      if (toggleTarget.coberturaTipo === 'manual') {
        const res = await desmarcarCubierta(toggleTarget.baja.num_empleado);
        if (res.ok) sileo.info({ title: 'Vacante reabierta' });
        else sileo.error({ title: 'No se pudo reabrir la vacante' });
      } else {
        const res = await marcarCubierta(toggleTarget.baja.num_empleado, localTodayIso());
        if (res.ok) sileo.success({ title: 'Vacante cubierta' });
        else sileo.error({ title: 'No se pudo marcar la vacante' });
      }
    } finally {
      setIsToggling(false);
      setToggleTarget(null);
    }
  }

  function handleToggleManualClick(v: AutoVacancy) {
    if (!v.baja) return;
    setToggleTarget(v);
  }

  function findCustomPosition(v: AutoVacancy) {
    const key = `${normalizeString(v.area)}::${normalizeString(v.seccion)}::${normalizePuesto(v.puesto)}`;
    return customPositions.find(
      (p) => `${normalizeString(p.area)}::${normalizeString(p.seccion)}::${normalizePuesto(p.puesto)}` === key
    );
  }

  function canRemoveStructural(v: AutoVacancy): boolean {
    if (v.baja) return false;
    return Boolean(findCustomPosition(v)) || v.vacancyType === 'backup';
  }

  async function confirmRemoveStructural() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      const v = deleteTarget;
      const cp = findCustomPosition(v);

      if (cp) {
        await notifyResult(deletePosition({ area: cp.area, seccion: cp.seccion, puesto: cp.puesto }), {
          success: 'Posición personalizada eliminada',
          error: 'No se pudo eliminar la posición',
        });
      } else if (v.vacancyType === 'backup') {
        const existing = positions.find(
          (p) =>
            normalizeString(p.area) === normalizeString(v.area) &&
            normalizeString(p.seccion) === normalizeString(v.seccion || '') &&
            normalizePuesto(p.puesto) === normalizePuesto(v.puesto)
        );
        
        await notifyResult(
          upsertPositionSetting({
            area: v.area,
            seccion: v.seccion || '',
            puesto: v.puesto,
            backup: 0,
            plantilla_autorizada: existing?.plantilla_autorizada ?? null,
            urgentes: existing?.urgentes ?? 0,
          }),
          {
            success: 'Configuración de backup actualizada a 0',
            error: 'No se pudo actualizar el backup',
          }
        );
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleRemoveStructuralClick(v: AutoVacancy) {
    if (v.baja) return;
    setDeleteTarget(v);
  }

  const hasData = bajas.length > 0 || employees.length > 0 || positions.length > 0;
  if (loading && !hasData) {
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
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Vacantes</h1>
        </div>
        <div className="pipeline__hero-actions">
          <button
            type="button"
            className="btn-secondary vacantes__config-btn"
            onClick={() => setMetricsModalOpen(true)}
            title="Ver KPIs y Filtros"
            aria-label="Ver KPIs"
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span style={{ marginLeft: 'var(--spacing-xs)' }}>KPIs</span>
          </button>
          <button
            type="button"
            className="btn-secondary vacantes__config-btn"
            onClick={() => setMonthlyModalOpen(true)}
            title="Ver vacantes por mes"
            aria-label="Ver vacantes por mes"
          >
            <Calendar size={16} aria-hidden="true" />
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn-secondary vacantes__config-btn"
              onClick={() => setWizardOpen(true)}
              data-testid="vac-config-btn"
              aria-label="Configuración de posiciones"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {isAdmin && (
        <PositionSettingsWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        icon={<AlertTriangle size={20} className="color-error" aria-hidden="true" />}
        title={deleteTarget ? (findCustomPosition(deleteTarget) ? 'Eliminar posición' : 'Quitar backup') : ''}
        size="md"
        fullscreenMobile={false}
      >
        {deleteTarget && (
          <div className="modal-body">
            <p>
              {findCustomPosition(deleteTarget)
                ? `¿Estás seguro de que quieres eliminar permanentemente la posición personalizada "${toTitleCase(deleteTarget.puesto)}"?`
                : `¿Quieres quitar esta vacante de backup para "${toTitleCase(deleteTarget.puesto)}"? Su configuración de backup se ajustará a 0.`}
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmRemoveStructural}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!toggleTarget}
        onClose={() => !isToggling && setToggleTarget(null)}
        icon={<AlertTriangle size={20} className="color-warning" aria-hidden="true" />}
        title={toggleTarget?.coberturaTipo === 'manual' ? '¿Reabrir vacante?' : '¿Marcar como cubierta?'}
        size="md"
        fullscreenMobile={false}
      >
        {toggleTarget && (
          <div className="modal-body">
            <p>
              {toggleTarget.coberturaTipo === 'manual'
                ? `"${toTitleCase(toggleTarget.puesto)}" volverá a contar como vacante activa.`
                : `"${toTitleCase(toggleTarget.puesto)}" dejará de contar como vacante activa.`}
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setToggleTarget(null)}
                disabled={isToggling}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmToggleManual}
                disabled={isToggling}
              >
                {isToggling ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={monthlyModalOpen}
        onClose={() => setMonthlyModalOpen(false)}
        icon={<Calendar size={20} className="color-primary" aria-hidden="true" />}
        title="Vacantes por mes"
        size="md"
        fullscreenMobile={false}
      >
        <div className="modal-body vacantes__monthly-body">
          {vacanciesByMonth.length === 0 ? (
            <p className="color-muted" style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0' }}>No hay datos disponibles.</p>
          ) : (
            <ul className="vacantes__monthly-list">
              {vacanciesByMonth.map(([monthKey, counts]) => (
                <li key={monthKey} className="vacantes__monthly-item">
                  <div className="vacantes__monthly-header">
                    <span className="vacantes__monthly-label">
                      {monthKey === 'Estructurales' ? 'Estructurales' : formatMonthLabel(monthKey)}
                    </span>
                    <span className="vacantes__monthly-total">{counts.total}</span>
                  </div>
                  <div className="vacantes__monthly-bars">
                    <div className="vacantes__monthly-bar" style={{ flex: counts.abierta || 0 }}>
                      {counts.abierta > 0 && <span className="vacantes__monthly-val color-error">{counts.abierta} ab.</span>}
                    </div>
                    <div className="vacantes__monthly-bar" style={{ flex: counts.cubierta || 0 }}>
                      {counts.cubierta > 0 && <span className="vacantes__monthly-val color-success">{counts.cubierta} cub.</span>}
                    </div>
                  </div>
                  <div className="vacantes__monthly-puestos">
                    <div className="vacantes__monthly-puestos-header">
                      <span className="vacantes__monthly-col-puesto">Puesto</span>
                      <span className="vacantes__monthly-col-num vacantes__monthly-col-num--open">Ab.</span>
                      <span className="vacantes__monthly-col-num vacantes__monthly-col-num--done">Cub.</span>
                    </div>
                    {Object.entries(counts.puestos)
                      .sort((a, b) => (b[1].abierta + b[1].cubierta) - (a[1].abierta + a[1].cubierta))
                      .map(([puesto, cnt]) => (
                        <div key={puesto} className="vacantes__monthly-puesto-row">
                          <span className="vacantes__monthly-col-puesto">{puesto}</span>
                          <span className="vacantes__monthly-col-num vacantes__monthly-col-num--open">
                            {cnt.abierta > 0 ? cnt.abierta : <span className="vacantes__monthly-col-zero">—</span>}
                          </span>
                          <span className="vacantes__monthly-col-num vacantes__monthly-col-num--done">
                            {cnt.cubierta > 0 ? cnt.cubierta : <span className="vacantes__monthly-col-zero">—</span>}
                          </span>
                        </div>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <div className="pipeline__layout">
        <div className="pipeline__content">

          <section className="pipeline__controls">
            <div className="pipeline__search-container">
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
            </div>

            {totalPages > 1 && (
              <div className="pipeline__pagination-controls">
                <button
                  type="button"
                  className="btn-icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  aria-label="Página anterior"
                  title="Página anterior"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span className="pipeline__pagination-text">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  aria-label="Página siguiente"
                  title="Página siguiente"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>

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
              <section className="vacantes__cards" aria-label="Lista de vacantes">
                {filtered.map((v) => (
                  <VacancyCard
                    key={v.key}
                    v={v}
                    onReclutador={(val) => handleReclutador(v, val)}
                    onToggleManual={() => handleToggleManualClick(v)}
                    canDelete={canRemoveStructural(v)}
                    onDelete={() => handleRemoveStructuralClick(v)}
                  />
                ))}
              </section>

              <section className="pipeline__table-wrap vacantes__table" aria-label="Tabla de vacantes">
                <table className="pipeline__table" aria-labelledby="vac-table-caption">
                  <caption id="vac-table-caption" className="sr-only">
                    Listado de vacantes — {filtered.length} de {vacancies.length}
                  </caption>
                  <colgroup>
                    <col className="vac-col--baja" />
                    <col className="vac-col--posicion" />
                    <col className="vac-col--tipo" />
                    <col className="vac-col--sla" />
                    <col className="vac-col--reclutador" />
                    <col className="vac-col--accion" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" id="vac-th-baja">Baja</th>
                      <th scope="col" id="vac-th-puesto">Posición</th>
                      <th scope="col" id="vac-th-tipo">Tipo</th>
                      <th scope="col" id="vac-th-sla">SLA</th>
                      <th scope="col" id="vac-th-reclutador">Reclutador</th>
                      <th scope="col" id="vac-th-accion" className="pipeline__th--actions">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((v) => (
                      <tr key={v.key} className={v.status === 'abierta' ? 'vacantes__row--overdue' : ''}>
                        <td headers="vac-th-baja">
                          {v.baja ? (
                            <>
                              <div className="vacantes__cell-strong" title={v.baja.nombre}>{toTitleCase(v.baja.nombre)}</div>
                              <div className="vacantes__cell-emp">#{v.baja.num_empleado} · {formatShortDate(v.fechaBaja)}</div>
                            </>
                          ) : (
                            <>
                              <div className="vacantes__cell-strong">—</div>
                              <div className="vacantes__cell-emp">Vacante estructural</div>
                            </>
                          )}
                        </td>
                        <td headers="vac-th-puesto">
                          <div className="pipeline__puesto" title={v.puesto}>{toTitleCase(v.puesto)}</div>
                          <div className="pipeline__area" title={`${v.area}${v.seccion ? ` · ${v.seccion}` : ''}`}>
                            {toTitleCase(v.area)}{v.seccion ? ` · ${toTitleCase(v.seccion)}` : ''}
                          </div>
                        </td>
                        <td headers="vac-th-tipo">
                          <VacancyTypeBadge type={v.vacancyType} />
                        </td>
                        <td headers="vac-th-sla">
                          <div className="vacantes__sla-cell">
                            {v.baja ? (
                              <SlaBadge v={v} />
                            ) : <span className="vacantes__sla">—</span>}
                          </div>
                        </td>
                        <td headers="vac-th-reclutador">
                          <CustomSelect
                            id={`vac-rec-${v.key}`}
                            value={v.reclutador ?? ''}
                            onChange={(val) => handleReclutador(v, val)}
                            options={RECLUTADOR_OPTIONS}
                            placeholder="Sin asignar"
                            aria-label={`Reclutador para ${v.puesto}`}
                            disabled={!v.baja}
                            customTrigger={
                              v.reclutador && v.reclutador !== 'Sin asignar' ? (
                                <ReclutadorBadge nombre={v.reclutador} showCaret />
                              ) : (
                                <span className="reclutador-badge" style={{ color: 'var(--color-muted)' }}>
                                  <span>Sin asignar</span>
                                  <ChevronDown size={14} style={{ opacity: 0.6, marginLeft: 2 }} aria-hidden="true" />
                                </span>
                              )
                            }
                          />
                        </td>
                        <td headers="vac-th-accion" className="pipeline__cell-actions">
                          <Tooltip content={!v.baja ? 'Vacante estructural' : v.coberturaTipo === 'manual' ? 'Reabrir vacante' : 'Marcar cubierta a mano'}>
                            <button
                              type="button"
                              className="pipeline__icon-btn"
                              onClick={() => handleToggleManualClick(v)}
                              disabled={!v.baja}
                              aria-label={!v.baja ? 'Vacante estructural' : v.coberturaTipo === 'manual' ? 'Reabrir vacante' : 'Marcar cubierta a mano'}
                            >
                              {v.coberturaTipo === 'manual' ? <ArrowRightLeft size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                          </Tooltip>
                          {canRemoveStructural(v) && (
                            <Tooltip content={findCustomPosition(v) ? 'Eliminar posición' : 'Quitar vacante de backup'}>
                              <button
                                type="button"
                                className="pipeline__icon-btn vacantes__del-btn"
                                onClick={() => handleRemoveStructuralClick(v)}
                                data-testid={`vac-delete-${v.key}`}
                                aria-label={findCustomPosition(v) ? 'Eliminar posición' : 'Quitar vacante de backup'}
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </Tooltip>
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

      {/* ── Modal de Menú de Métricas y Filtros ── */}
      <Modal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        title="Métricas y KPIs"
        size="md"
        fullscreenMobile={false}
      >
        <div className="modal-body">
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


        </div>
      </Modal>
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
      <Tooltip content={v.baja?.cubierta_nota ?? 'Cobertura interna'}>
        <span className="vacantes__cover">
          <ArrowRightLeft size={13} aria-hidden="true" />
          Interna{v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}
        </span>
      </Tooltip>
    );
  }
  if (!v.coveredBy) {
    // Baja absorbida: el puesto ya está cubierto por la plantilla vigente.
    return (
      <Tooltip content="Cubierto">
        <span className="vacantes__cover">
          <UserPlus size={13} aria-hidden="true" />
          Plantilla completa
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip content={`Ingreso: ${v.coveredBy?.fecha_ingreso ?? ''}`}>
      <span className="vacantes__cover">
        <UserPlus size={13} aria-hidden="true" />
        {v.coveredBy?.nombre}
        {v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}
      </span>
    </Tooltip>
  );
}

/** Tarjeta mobile (abre modal de detalle) de una vacante automática. */
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
          ? `${toTitleCase(v.coveredBy.nombre)}${v.fechaCubierta ? ` · ${formatShortDate(v.fechaCubierta)}` : ''}`
          : 'Plantilla completa';

  return (
    <>
      <article className={cardCls} aria-label={`Vacante de ${v.puesto}`}>
        {/* Cabecera: tap para abrir detalle */}
        <button
          type="button"
          className="vacantes__card-head"
          onClick={() => setOpen(true)}
          data-testid={`vac-card-toggle-${v.key}`}
        >
          <div className="vacantes__card-title">
            <div className="vacantes__card-puesto">{toTitleCase(v.puesto)}</div>
            <div className="vacantes__card-sub">
              {toTitleCase(v.area)}
              {v.seccion ? ` · ${toTitleCase(v.seccion)}` : ''}
            </div>
          </div>
          <div className="vacantes__card-head-right">
            <ChevronRight
              size={18}
              className="vacantes__chevron"
              aria-hidden="true"
            />
          </div>
        </button>
      </article>

      {/* Modal de detalle (pantalla completa en móvil) */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={toTitleCase(v.puesto)}
        fullscreenMobile={true}
        size="md"
        className="vacantes__mobile-modal"
      >
        <div className="vacantes__modal-inner">
          <div className="vacantes__modal-header-meta">
            {toTitleCase(v.area)}{v.seccion ? ` · ${toTitleCase(v.seccion)}` : ''}
          </div>

          <div className="vacantes__modal-badges">
            <VacancyStatusBadge status={v.status} />
            <VacancyTypeBadge type={v.vacancyType} />
            {v.baja && <SlaBadge v={v} />}
          </div>

          <div className="vacantes__detail-grid">
            <div className="vacantes__detail-label-col">
              <UserPlus size={16} aria-hidden="true" />
              <span>Cobertura</span>
            </div>
            <div className="vacantes__detail-value-col vacantes__detail-value-col--strong">
              {coberturaText}
            </div>

            <div className="vacantes__detail-label-col">
              <Calendar size={16} aria-hidden="true" />
              <span>Baja</span>
            </div>
            <div className="vacantes__detail-value-col">
              {v.baja
                ? `${toTitleCase(v.baja.nombre)} (#${v.baja.num_empleado}) · ${formatShortDate(v.fechaBaja)}`
                : 'Sin baja asociada'}
            </div>

            <div className="vacantes__detail-label-col">
              <Clock size={16} aria-hidden="true" />
              <span>Tiempo</span>
            </div>
            <div className="vacantes__detail-value-col">
              {v.baja
                ? `${v.dias} días ${v.status === 'cubierta' ? 'para cubrir' : 'abierta'}`
                : '—'}
            </div>
          </div>

          <div className="vacantes__detail-actions">
            <div className="vacantes__detail-action-primary">
              <label htmlFor={`vac-rec-card-${v.key}`} className="sr-only">Asignar Reclutador</label>
              <CustomSelect
                id={`vac-rec-card-${v.key}`}
                value={v.reclutador ?? ''}
                onChange={onReclutador}
                options={RECLUTADOR_OPTIONS}
                placeholder="Sin asignar"
                aria-label={`Reclutador para ${v.puesto}`}
                disabled={!v.baja}
                customTrigger={
                  v.reclutador && v.reclutador !== 'Sin asignar' ? (
                    <ReclutadorBadge nombre={v.reclutador} showCaret />
                  ) : (
                    <span className="reclutador-badge" style={{ color: 'var(--color-muted)' }}>
                      <span>Sin asignar</span>
                      <ChevronDown size={14} style={{ opacity: 0.6, marginLeft: 2 }} aria-hidden="true" />
                    </span>
                  )
                }
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary vacantes__detail-btn"
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
            {canDelete && onDelete && (
              <button
                type="button"
                className="btn btn-secondary vacantes__detail-btn vacantes__del-btn"
                onClick={onDelete}
                title="Eliminar o quitar backup"
                aria-label="Eliminar o quitar backup"
                data-testid={`vac-delete-card-${v.key}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
