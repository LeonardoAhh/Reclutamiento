import { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  UserPlus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  Table2,
  LayoutGrid,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { PipelineKanban } from '@/components/pipeline/PipelineKanban';
import { useCandidates } from '@/hooks/useCandidates';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus } from '@/lib/types';
import './Pipeline.css';

type ViewMode = 'table' | 'kanban';
const VIEW_STORAGE_KEY = 'pipeline_view_mode';

type ModalMode = 'add' | 'edit' | 'delete' | null;

const ACTIVE_STATUSES: ReadonlyArray<CandidateStatus> = [
  'aplico',
  'revision',
  'entrevista_1',
  'entrevista_2',
  'oferta',
];

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function Pipeline() {
  const {
    candidates,
    loading,
    isConfigured,
    saveStatus,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    deleteCandidate,
  } = useCandidates();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      return stored === 'kanban' ? 'kanban' : 'table';
    } catch {
      return 'table';
    }
  });

  function changeView(next: ViewMode) {
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable; ignore.
    }
  }

  const totals = useMemo(() => {
    const total = candidates.length;
    const enProceso = candidates.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
    const contratados = candidates.filter((c) => c.status === 'contratado').length;
    const rechazados = candidates.filter((c) => c.status === 'rechazado').length;
    return { total, enProceso, contratados, rechazados };
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const haystack = [c.nombre, c.puesto, c.area, c.reclutador, c.source, c.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [candidates, searchTerm]);

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
          <h1>Pipeline de candidatos</h1>
          <div className="pipeline__hero-status">
            <Badge variant={isConfigured ? 'success' : 'amber'}>
              {isConfigured ? 'Conectado a base de datos' : 'Modo local'}
            </Badge>
            {saveStatus === 'saving' && <Badge variant="teal">Guardando…</Badge>}
            {saveStatus === 'saved' && <Badge variant="success">Guardado</Badge>}
            {saveStatus === 'error' && <Badge variant="error">Error al guardar</Badge>}
          </div>
        </div>
        <div className="pipeline__hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nuevo candidato"
            title="Nuevo candidato"
          >
            <UserPlus size={18} aria-hidden="true" />
            Nuevo candidato
          </button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="pipeline__kpis">
        <StatCard
          id="stat-pipeline-total"
          label="Total"
          value={totals.total}
          icon={<Users size={20} />}
          accentColor="var(--color-ink)"
        />
        <StatCard
          id="stat-pipeline-activo"
          label="En proceso"
          value={totals.enProceso}
          icon={<Activity size={20} />}
          accentColor="var(--color-primary)"
        />
        <StatCard
          id="stat-pipeline-contratado"
          label="Contratados"
          value={totals.contratados}
          icon={<UserCheck size={20} />}
          accentColor="var(--color-accent-teal)"
        />
        <StatCard
          id="stat-pipeline-rechazado"
          label="Rechazados"
          value={totals.rechazados}
          icon={<UserX size={20} />}
          accentColor="var(--color-error)"
        />
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
            <span>Tabla</span>
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
            <span>Kanban</span>
          </button>
        </div>
      </section>

      {/* ── Vista (tabla o kanban) ── */}
      {filtered.length === 0 ? (
        <section className="pipeline__empty">
          {candidates.length === 0 ? (
            <>
              <h2>Aún no hay candidatos</h2>
              <p>
                Empieza agregando tu primer candidato al pipeline. Llena el formulario
                con datos de contacto, puesto al que aplica y su etapa actual.
              </p>
              <button type="button" className="btn-primary" onClick={openAdd}>
                <UserPlus size={18} aria-hidden="true" />
                Agregar primer candidato
              </button>
            </>
          ) : (
            <>
              <h2>Sin resultados</h2>
              <p>Ningún candidato coincide con la búsqueda actual.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSearchTerm('')}
              >
                Limpiar búsqueda
              </button>
            </>
          )}
        </section>
      ) : viewMode === 'kanban' ? (
        <PipelineKanban
          candidates={filtered}
          onEdit={openEdit}
          onDelete={openDelete}
          onStatusChange={(c, status) => handleStatusChange(c, status)}
        />
      ) : (
        <section className="pipeline__table-wrap" aria-label="Tabla de candidatos">
          <table className="pipeline__table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Puesto · Área</th>
                <th scope="col">Estado</th>
                <th scope="col">Reclutador</th>
                <th scope="col">Fuente</th>
                <th scope="col">Aplicó</th>
                <th scope="col" className="pipeline__th--actions">CV</th>
                <th scope="col" className="pipeline__th--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id ?? c.nombre + c.fecha_aplicacion}>
                  <td className="pipeline__cell-name">
                    <div className="pipeline__name">{c.nombre}</div>
                    {c.email || c.telefono ? (
                      <div className="pipeline__contact">
                        {c.email && <span>{c.email}</span>}
                        {c.email && c.telefono && <span aria-hidden="true"> · </span>}
                        {c.telefono && <span>{c.telefono}</span>}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="pipeline__puesto">{c.puesto}</div>
                    <div className="pipeline__area">{c.area}</div>
                  </td>
                  <td className="pipeline__cell-status">
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
                  </td>
                  <td>{c.reclutador || '—'}</td>
                  <td>{c.source || '—'}</td>
                  <td>{formatDate(c.fecha_aplicacion)}</td>
                  <td className="pipeline__cell-cv">
                    {c.cv_url ? (
                      <a
                        href={c.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pipeline__icon-btn"
                        title="Abrir CV"
                        aria-label={`Abrir CV de ${c.nombre}`}
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="pipeline__muted" aria-hidden="true">—</span>
                    )}
                  </td>
                  <td className="pipeline__cell-actions">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Modal ── */}
      <CandidateModal
        isOpen={modalMode !== null}
        mode={modalMode ?? 'add'}
        candidate={selected}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={deleteCandidate}
      />
    </main>
  );
}
