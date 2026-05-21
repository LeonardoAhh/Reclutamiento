import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  UserX,
  Pencil,
  Trash2,
  Search,
  Table2,
  LayoutGrid,
  StickyNote,
  SlidersHorizontal,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidateNotesModal } from '@/components/ui/CandidateNotesModal';
import { CandidateReportModal } from '@/components/ui/CandidateReportModal';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { PipelineKanban } from '@/components/pipeline/PipelineKanban';
import {
  CandidateFilters,
  EMPTY_FILTERS,
  type FilterState,
} from '@/components/pipeline/CandidateFilters';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus, Employee } from '@/lib/types';
import { formatShortDate, startOfDayMxMs, endOfDayMxMs } from '@/lib/dates';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { normalizeString } from '@/lib/utils';
import './Pipeline.css';

type ViewMode = 'table' | 'kanban';
const VIEW_STORAGE_KEY = 'pipeline_view_mode';
const FILTERS_STORAGE_KEY = 'pipeline_filters_v1';

type ModalMode = 'add' | 'edit' | 'delete' | null;

const formatDate = formatShortDate;

/**
 * Status que cuentan como "citado" para el hero de reclutadores. Tras
 * la simplificacion del pipeline a 4 etapas, citar = estar en Entrevista 1
 * o Entrevista 2. Contratado y Rechazado son terminales y se cuentan
 * aparte.
 */
const CITADO_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  'entrevista_1',
  'entrevista_2',
]);

type RecruiterStats = {
  name: string;
  total: number;
  citados: number;
  contratados: number;
  rechazados: number;
};

export function Pipeline() {
  const {
    candidates,
    notes,
    loading,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    markCandidateHired,
    deleteCandidate,
    addCandidateNote,
  } = useCandidates();

  const { addSingleEmployee } = useSupabaseData();
  const { coverVacancyForEmployee } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notesTarget, setNotesTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      return stored === 'kanban' ? 'kanban' : 'table';
    } catch {
      return 'table';
    }
  });
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!stored) return EMPTY_FILTERS;
      return { ...EMPTY_FILTERS, ...(JSON.parse(stored) as Partial<FilterState>) };
    } catch {
      return EMPTY_FILTERS;
    }
  });
  const [showFilters, setShowFilters] = useState(
    () => Object.values(filters).some((v) => v !== '')
  );

  function changeView(next: ViewMode) {
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable; ignore.
    }
  }

  function changeFilters(next: FilterState) {
    setFilters(next);
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable; ignore.
    }
  }

  function resetFilters() {
    changeFilters(EMPTY_FILTERS);
  }

  const activeFiltersCount = (
    Object.keys(filters) as Array<keyof FilterState>
  ).filter((k) => filters[k] !== '').length;

  /**
   * KPIs por reclutador activo. Cuenta candidatos cuyo `reclutador`
   * normalizado (mayusculas + sin acentos) coincide con uno de los
   * nombres canonicos en RECLUTADORES_ACTIVOS. Otros nombres se
   * descartan tanto del numerador como del denominador.
   */
  const recruiterStats = useMemo<RecruiterStats[]>(() => {
    const empty = (name: string): RecruiterStats => ({
      name,
      total: 0,
      citados: 0,
      contratados: 0,
      rechazados: 0,
    });
    const acc = new Map<string, RecruiterStats>();
    for (const name of RECLUTADORES_ACTIVOS) acc.set(name, empty(name));
    for (const c of candidates) {
      const norm = normalizeString(c.reclutador ?? '');
      const bucket = acc.get(norm);
      if (!bucket) continue;
      bucket.total += 1;
      if (c.status === 'contratado') bucket.contratados += 1;
      else if (c.status === 'rechazado') bucket.rechazados += 1;
      else if (CITADO_STATUSES.has(c.status)) bucket.citados += 1;
    }
    return Array.from(acc.values());
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    // Filtros de rango anclados a TZ MX para evitar desfases del visor.
    const desde = startOfDayMxMs(filters.fechaDesde);
    const hasta = endOfDayMxMs(filters.fechaHasta);

    return candidates.filter((c) => {
      if (filters.area && c.area !== filters.area) return false;
      if (filters.puesto && c.puesto !== filters.puesto) return false;
      if (filters.estado && c.status !== filters.estado) return false;
      if (filters.reclutador && (c.reclutador ?? '') !== filters.reclutador) return false;
      if (filters.source && (c.source ?? '') !== filters.source) return false;

      if (desde || hasta) {
        const ts = c.fecha_aplicacion ? new Date(c.fecha_aplicacion).getTime() : NaN;
        if (Number.isNaN(ts)) return false;
        if (desde && ts < desde) return false;
        if (hasta && ts > hasta) return false;
      }

      if (q) {
        const haystack = [c.nombre, c.puesto, c.area, c.reclutador, c.source, c.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [candidates, searchTerm, filters]);

  const notesCountByCandidate = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notes) {
      if (!n.candidate_id) continue;
      map.set(n.candidate_id, (map.get(n.candidate_id) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  function notesCount(c: Candidate): number {
    return c.id ? notesCountByCandidate.get(c.id) ?? 0 : 0;
  }

  function openAdd() {
    setSelected(null);
    setModalMode('add');
  }

  function openEdit(c: Candidate) {
    setSelected(c);
    setModalMode('edit');
  }

  function openDelete(c: Candidate) {
    setSelected(c);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
  }

  async function handleSave(
    payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) {
    if (id) {
      return updateCandidate(id, payload);
    }
    return addCandidate(payload);
  }

  async function handleStatusChange(c: Candidate, status: CandidateStatus) {
    if (!c.id || c.status === status) return;
    await setCandidateStatus(c.id, status);
  }

  function openHire(c: Candidate) {
    setHireTarget(c);
  }

  async function handleHire(input: {
    employee: Employee;
    candidateId: string;
  }): Promise<{ ok: boolean; message?: string }> {
    const empResult = await addSingleEmployee(input.employee);
    if (!empResult.ok) {
      return empResult;
    }
    const candResult = await markCandidateHired(
      input.candidateId,
      input.employee.num_empleado
    );
    if (!candResult.ok) {
      return {
        ok: false,
        message:
          candResult.message ??
          'Empleado creado, pero no se pudo actualizar el candidato.',
      };
    }
    // Cierra automáticamente la vacante abierta que coincida con el puesto.
    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });
    return { ok: true };
  }

  if (loading) {
    return (
      <main className="pipeline container">
        <section className="pipeline__hero">
          <div>
            <h1>Pipeline de candidatos</h1>
            <p className="pipeline__hero-sub">Cargando candidatos…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pipeline container">
      {/* ── Hero ── */}
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Candidatos</h1>
        </div>
        <div className="pipeline__hero-actions">
          <motion.button
            type="button"
            className="btn-secondary pipeline__report-btn"
            onClick={() => setReportOpen(true)}
            aria-label="Abrir resumen de candidatos"
            title="Resumen de candidatos para WhatsApp"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <ClipboardList size={16} aria-hidden="true" />
            <span className="pipeline__report-btn-label">Resumen</span>
          </motion.button>
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nuevo candidato"
            title="Nuevo candidato"
          >
            <UserPlus size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ── KPIs por reclutador ── */}
      <section
        className="pipeline__recruiters"
        aria-label="KPIs por reclutador"
      >
        {recruiterStats.map((r) => {
          const pct = (n: number) =>
            r.total === 0 ? 0 : Math.round((n / r.total) * 100);
          return (
            <article key={r.name} className="pipeline__recruiter-card">
              <header className="pipeline__recruiter-head">
                <h2 className="pipeline__recruiter-name">{r.name}</h2>
                <span
                  className="pipeline__recruiter-total"
                  title="Total de candidatos asignados (denominador)"
                >
                  {r.total} candidato{r.total === 1 ? '' : 's'}
                </span>
              </header>
              <dl className="pipeline__recruiter-stats">
                <div className="pipeline__recruiter-stat pipeline__recruiter-stat--citados">
                  <dt>Citados</dt>
                  <dd>
                    <span className="pipeline__recruiter-pct">
                      {pct(r.citados)}%
                    </span>
                    <span className="pipeline__recruiter-count">
                      ({r.citados})
                    </span>
                  </dd>
                </div>
                <div className="pipeline__recruiter-stat pipeline__recruiter-stat--contratados">
                  <dt>Contratados</dt>
                  <dd>
                    <span className="pipeline__recruiter-pct">
                      {pct(r.contratados)}%
                    </span>
                    <span className="pipeline__recruiter-count">
                      ({r.contratados})
                    </span>
                  </dd>
                </div>
                <div className="pipeline__recruiter-stat pipeline__recruiter-stat--rechazados">
                  <dt>Rechazados</dt>
                  <dd>
                    <span className="pipeline__recruiter-pct">
                      {pct(r.rechazados)}%
                    </span>
                    <span className="pipeline__recruiter-count">
                      ({r.rechazados})
                    </span>
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      {/* ── Search ── */}
      <section className="pipeline__controls">
        <div className="pipeline__search">
          <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
          <label htmlFor="pipeline-search" className="sr-only">
            Buscar candidato
          </label>
          <input
            id="pipeline-search"
            type="text"
            placeholder="Buscar por nombre, puesto, área, reclutador, fuente…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pipeline__search-input"
            autoComplete="off"
          />
        </div>
        <span className="pipeline__count">
          {filtered.length} de {candidates.length}
        </span>
        <button
          type="button"
          className={`btn-secondary pipeline__filter-btn${showFilters ? ' pipeline__filter-btn--active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="pipeline-filters"
          title="Filtros avanzados"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />

          {activeFiltersCount > 0 && (
            <span className="pipeline__filter-pill" aria-label={`${activeFiltersCount} activos`}>
              {activeFiltersCount}
            </span>
          )}
        </button>
        <div className="pipeline__view-toggle" role="tablist" aria-label="Cambiar vista">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'table'}
            className={`pipeline__view-btn${viewMode === 'table' ? ' pipeline__view-btn--active' : ''}`}
            onClick={() => changeView('table')}
            title="Vista de tabla"
          >
            <Table2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'kanban'}
            className={`pipeline__view-btn${viewMode === 'kanban' ? ' pipeline__view-btn--active' : ''}`}
            onClick={() => changeView('kanban')}
            title="Vista kanban"
          >
            <LayoutGrid size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ── Filtros avanzados ── */}
      {showFilters && (
        <div id="pipeline-filters">
          <CandidateFilters
            candidates={candidates}
            value={filters}
            onChange={changeFilters}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* ── Vista (tabla o kanban) ── */}
      {filtered.length === 0 ? (
        <section className="pipeline__empty">
          {candidates.length === 0 ? (
            <>
              <h2>Aún no hay candidatos</h2>
              <p>
                Empieza agregando tu primer candidato a la base de datos de reclutamiento.
              </p>
              <button type="button" className="btn-primary" onClick={openAdd} title="Agregar primer candidato">
                <UserPlus size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <h2>Sin resultados</h2>
              <p>Ningún candidato coincide con la búsqueda o los filtros actuales.</p>
              <div className="pipeline__empty-actions">
                {searchTerm && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSearchTerm('')}
                    title="Limpiar búsqueda"
                  >
                    <UserX size={16} aria-hidden="true" />
                  </button>
                )}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetFilters}
                    title="Limpiar filtros"
                  >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      ) : viewMode === 'kanban' ? (
        <PipelineKanban
          candidates={filtered}
          notesCount={notesCount}
          onEdit={openEdit}
          onDelete={openDelete}
          onNotes={(c) => setNotesTarget(c)}
          onHire={openHire}
          onStatusChange={(c, status) => handleStatusChange(c, status)}
        />
      ) : (
        <section
          className="pipeline__card-list"
          aria-label="Lista de candidatos"
        >
          {filtered.map((c) => {
            const initials = c.nombre
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('');
            return (
              <article
                key={c.id ?? c.nombre + c.fecha_aplicacion}
                className={`pipeline__ccard pipeline__ccard--${c.status}`}
              >
                <div
                  className="pipeline__ccard-avatar"
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div
                  className="pipeline__ccard-name-col"
                  data-puesto-area={`${c.puesto} · ${c.area}${c.seccion?.trim() ? ` · ${c.seccion.trim()}` : ''}`}
                >
                  <div className="pipeline__name">{c.nombre}</div>
                  <div className="pipeline__contact">
                    {c.telefono || c.email || '—'}
                  </div>
                </div>
                <div className="pipeline__ccard-puesto-col">
                  <div className="pipeline__puesto">{c.puesto}</div>
                  <div className="pipeline__area">
                    {c.area}
                    {c.seccion?.trim() ? ` · ${c.seccion.trim()}` : ''}
                  </div>
                </div>
                <div className="pipeline__cell-status pipeline__ccard-status-col">
                  <CandidateStatusBadge status={c.status} />
                  <label className="sr-only" htmlFor={`status-${c.id}`}>
                    Cambiar estado de {c.nombre}
                  </label>
                  <select
                    id={`status-${c.id}`}
                    className="pipeline__status-select"
                    value={c.status}
                    onChange={(e) =>
                      handleStatusChange(c, e.target.value as CandidateStatus)
                    }
                    aria-label={`Cambiar estado de ${c.nombre}`}
                  >
                    {CANDIDATE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {CANDIDATE_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pipeline__ccard-dates-col pipeline__cell-dates">
                  <div className="pipeline__cell-dates-primary">
                    {formatDate(c.fecha_aplicacion)}
                  </div>
                  <div className="pipeline__cell-dates-secondary">
                    {c.fecha_cita ? formatDate(c.fecha_cita) : '—'}
                  </div>
                </div>
                <div className="pipeline__cell-actions pipeline__ccard-actions-col">
                  {c.status === 'contratado' && !c.employee_num && (
                    <button
                      type="button"
                      className="pipeline__icon-btn pipeline__icon-btn--primary"
                      onClick={() => openHire(c)}
                      aria-label={`Contratar a ${c.nombre}`}
                      title="Contratar (crear empleado)"
                    >
                      <BadgeCheck size={16} aria-hidden="true" />
                    </button>
                  )}
                  {c.employee_num && (
                    <span
                      className="pipeline__hired-tag"
                      title={`Empleado #${c.employee_num}`}
                    >
                      <BadgeCheck size={12} aria-hidden="true" />
                      #{c.employee_num}
                    </span>
                  )}
                  <button
                    type="button"
                    className="pipeline__icon-btn"
                    onClick={() => setNotesTarget(c)}
                    aria-label={`Notas de ${c.nombre}`}
                    title={`Notas (${notesCount(c)})`}
                  >
                    <StickyNote size={16} aria-hidden="true" />
                    {notesCount(c) > 0 && (
                      <span className="pipeline__icon-badge">{notesCount(c)}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="pipeline__icon-btn"
                    onClick={() => openEdit(c)}
                    aria-label={`Editar a ${c.nombre}`}
                    title="Editar"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pipeline__icon-btn pipeline__icon-btn--danger"
                    onClick={() => openDelete(c)}
                    aria-label={`Eliminar a ${c.nombre}`}
                    title="Eliminar"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ── Modales ── */}
      <CandidateModal
        isOpen={modalMode !== null}
        mode={modalMode ?? 'add'}
        candidate={selected}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={deleteCandidate}
      />

      <CandidateNotesModal
        isOpen={notesTarget !== null}
        candidate={notesTarget}
        notes={notes}
        onClose={() => setNotesTarget(null)}
        onSave={addCandidateNote}
      />

      <HireCandidateModal
        isOpen={hireTarget !== null}
        candidate={hireTarget}
        onClose={() => setHireTarget(null)}
        onConfirm={handleHire}
      />

      {/* ── Candidate Report Modal (WhatsApp-ready) ── */}
      <CandidateReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        candidates={candidates}
      />
    </main>
  );
}
