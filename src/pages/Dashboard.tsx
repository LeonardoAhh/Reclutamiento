import { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Search,
  Filter,
  UserPlus as UserPlusIcon,
  Trash2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { CoverageBar } from '@/components/ui/CoverageBar';
import { Badge } from '@/components/ui/Badge';
import { CommentModal } from '@/components/ui/CommentModal';
import { JsonImporter } from '@/components/ui/JsonImporter';
import { EmployeeModal } from '@/components/ui/EmployeeModal';
import {
  transformEmployeeData,
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  getCoverageColor,
} from '@/lib/utils';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import type {
  Employee,
  EmployeeRaw,
  PositionComment,
  DepartmentCoverage,
} from '@/lib/types';
import './Dashboard.css';

export function Dashboard() {
  const {
    employees,
    comments,
    loading,
    isConfigured,
    saveStatus,
    upsertEmployees,
    addComment,
    addSingleEmployee,
    deleteEmployee,
  } = useSupabaseData();

  const { coverVacancyForEmployee } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [commentTarget, setCommentTarget] = useState<{
    area: string;
    seccion: string;
    puesto: string;
  } | null>(null);

  // Employee Modal State
  const [empModalMode, setEmpModalMode] = useState<'add' | 'delete' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments),
    [employees, comments]
  );

  const departmentCoverage = useMemo(
    () => calculateDepartmentCoverage(positionCoverage),
    [positionCoverage]
  );

  const totals = useMemo(() => {
    const autorizada = departmentCoverage.reduce((s, d) => s + d.plantilla_autorizada, 0);
    const real = departmentCoverage.reduce((s, d) => s + d.plantilla_real, 0);
    const vacantes = departmentCoverage.reduce((s, d) => s + d.vacantes, 0);
    const cobertura = autorizada > 0 ? Math.round((real / autorizada) * 100) : 0;
    return { autorizada, real, vacantes, cobertura };
  }, [departmentCoverage]);

  const filteredDepts = useMemo(() => {
    let result = departmentCoverage;
    if (filterArea) {
      result = result.filter((d) => d.area === filterArea);
    }
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      result = result
        .map((dept) => ({
          ...dept,
          puestos: dept.puestos.filter(
            (p) =>
              p.puesto.toUpperCase().includes(term) ||
              p.seccion.toUpperCase().includes(term) ||
              p.area.toUpperCase().includes(term)
          ),
        }))
        .filter((dept) => dept.puestos.length > 0);
    }
    return result;
  }, [departmentCoverage, filterArea, searchTerm]);

  const matchingEmployees = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    return employees
      .filter(
        (e) =>
          e.nombre.toUpperCase().includes(term) ||
          e.num_empleado.includes(term)
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

  const areas = useMemo(
    () => departmentCoverage.map((d) => d.area),
    [departmentCoverage]
  );

  async function handleImport(rawData: EmployeeRaw[]) {
    const transformed = rawData.map((r) => transformEmployeeData(r) as Employee);
    // Identifica los empleados realmente nuevos (no presentes antes del upsert)
    // para correr el auto-cover únicamente sobre ellos.
    const previousNums = new Set(employees.map((e) => e.num_empleado));
    const incoming = transformed.filter((e) => !previousNums.has(e.num_empleado));
    await upsertEmployees(transformed);
    for (const emp of incoming) {
      await coverVacancyForEmployee(emp, { source: 'json-import' });
    }
  }

  function toggleDept(area: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      next.has(area) ? next.delete(area) : next.add(area);
      return next;
    });
  }

  function expandAll() {
    setExpandedDepts(new Set(areas));
  }

  function collapseAll() {
    setExpandedDepts(new Set());
  }

  function handleSaveComment(comment: PositionComment) {
    addComment(comment);
    setCommentTarget(null);
  }

  function getCoverageBadge(pct: number) {
    if (pct >= 100) return 'success' as const;
    if (pct >= 75) return 'teal' as const;
    if (pct >= 50) return 'amber' as const;
    return 'error' as const;
  }

  async function handleSaveEmployee(emp: Employee) {
    const result = await addSingleEmployee(emp);
    if (result.ok) {
      await coverVacancyForEmployee(emp, { source: 'dashboard-add' });
    }
    return result;
  }

  async function handleDeleteEmployee(num_empleado: string) {
    const result = await deleteEmployee(num_empleado);
    if (result.ok) {
      setSearchTerm('');
    }
    return result;
  }

  function openDeleteFor(emp: Employee) {
    setSelectedEmployee(emp);
    setEmpModalMode('delete');
  }

  if (loading) {
    return (
      <main className="dashboard container" id="dashboard-main">
        <section className="dashboard__hero" id="dashboard-hero">
          <div className="dashboard__hero-content">
            <h1>Control de Plantilla</h1>
            <p className="dashboard__hero-sub">Cargando datos…</p>
          </div>
        </section>
      </main>
    );
  }

  const showSearchDropdown =
    matchingEmployees.length > 0 && empModalMode === null;

  return (
    <main className="dashboard container" id="dashboard-main">
      {/* ── Hero Band ── */}
      <section className="dashboard__hero" id="dashboard-hero">
        <div className="dashboard__hero-content">
          <h1>Control de Plantilla</h1>
        </div>
        <div className="dashboard__hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setSelectedEmployee(null);
              setEmpModalMode('add');
            }}
          >
            <UserPlusIcon size={16} aria-hidden="true" />
            Nuevo empleado
          </button>
          <JsonImporter onImport={handleImport} />
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <section className="dashboard__kpis" id="dashboard-kpis">
        <StatCard
          id="stat-autorizada"
          label="Plantilla Autorizada"
          value={totals.autorizada}
          icon={<Users size={20} />}
          accentColor="var(--color-ink)"
        />
        <StatCard
          id="stat-real"
          label="Plantilla Real"
          value={totals.real}
          icon={<UserCheck size={20} />}
          accentColor="var(--color-accent-teal)"
        />
        <StatCard
          id="stat-vacantes"
          label="Vacantes"
          value={totals.vacantes}
          icon={<UserX size={20} />}
          accentColor="var(--color-error)"
        />
        <StatCard
          id="stat-cobertura"
          label="% Cobertura Global"
          value={`${totals.cobertura}%`}
          icon={<TrendingUp size={20} />}
          accentColor={getCoverageColor(totals.cobertura)}
          variant="dark"
        />
      </section>

      {/* ── Search & Filter ── */}
      <section className="dashboard__controls" id="dashboard-controls">
        <div className="dashboard__search">
          <Search size={16} className="dashboard__search-icon" aria-hidden="true" />
          <label htmlFor="search-input" className="sr-only">
            Buscar empleado, puesto o sección
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar empleado, puesto, sección…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard__search-input"
            autoComplete="off"
            aria-haspopup="listbox"
            aria-expanded={showSearchDropdown}
          />
          {showSearchDropdown && (
            <div className="dashboard__search-dropdown" role="listbox">
              <div className="search-dropdown__head">Empleados encontrados</div>
              {matchingEmployees.map((emp) => (
                <div key={emp.num_empleado} className="search-dropdown-item" role="option" aria-selected="false">
                  <div className="search-dropdown-item__info">
                    <span className="emp-name">{emp.nombre}</span>
                    <span className="emp-meta">
                      {emp.puesto} · #{emp.num_empleado}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="search-dropdown-item__delete"
                    onClick={() => openDeleteFor(emp)}
                    aria-label={`Eliminar a ${emp.nombre}`}
                    title="Eliminar empleado"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard__filter">
          <Filter size={16} aria-hidden="true" />
          <label htmlFor="filter-area" className="sr-only">
            Filtrar por área
          </label>
          <select
            id="filter-area"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="dashboard__filter-select"
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="dashboard__expand-controls">
          <button
            id="btn-expand-all"
            type="button"
            className="btn-text"
            onClick={expandAll}
          >
            Expandir todo
          </button>
          <span className="dashboard__separator" aria-hidden="true">|</span>
          <button
            id="btn-collapse-all"
            type="button"
            className="btn-text"
            onClick={collapseAll}
          >
            Colapsar todo
          </button>
        </div>
      </section>

      {/* ── Department Cards ── */}
      <section className="dashboard__departments" id="dashboard-departments">
        {filteredDepts.length === 0 && employees.length === 0 && (
          <div className="dashboard__empty" id="dashboard-empty">
            <Users size={48} strokeWidth={1} />
            <h3>Sin datos cargados</h3>
            <p>Importa un archivo JSON o crea un empleado para comenzar.</p>
          </div>
        )}

        {filteredDepts.length === 0 && employees.length > 0 && (
          <div className="dashboard__empty" id="dashboard-no-results">
            <Search size={48} strokeWidth={1} />
            <h3>Sin resultados</h3>
            <p>No se encontraron coincidencias para tu búsqueda.</p>
          </div>
        )}

        {filteredDepts.map((dept) => (
          <DepartmentCard
            key={dept.area}
            dept={dept}
            isExpanded={expandedDepts.has(dept.area)}
            onToggle={() => toggleDept(dept.area)}
            onOpenComment={(area, seccion, puesto) =>
              setCommentTarget({ area, seccion, puesto })
            }
            getCoverageBadge={getCoverageBadge}
            comments={comments}
          />
        ))}
      </section>

      {/* ── Comment Modal ── */}
      <CommentModal
        isOpen={commentTarget !== null}
        area={commentTarget?.area ?? ''}
        seccion={commentTarget?.seccion ?? ''}
        puesto={commentTarget?.puesto ?? ''}
        existingComments={comments.filter(
          (c) =>
            commentTarget !== null &&
            c.area === commentTarget.area &&
            c.seccion === commentTarget.seccion &&
            c.puesto === commentTarget.puesto
        )}
        onClose={() => setCommentTarget(null)}
        onSave={handleSaveComment}
      />

      {/* ── Employee Modal (Add / Delete) ── */}
      <EmployeeModal
        isOpen={empModalMode !== null}
        mode={empModalMode ?? 'add'}
        employee={selectedEmployee}
        onClose={() => setEmpModalMode(null)}
        onSave={handleSaveEmployee}
        onDelete={handleDeleteEmployee}
      />
    </main>
  );
}

/* ── Department Accordion Card ── */

interface DepartmentCardProps {
  dept: DepartmentCoverage;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenComment: (area: string, seccion: string, puesto: string) => void;
  getCoverageBadge: (pct: number) => 'success' | 'teal' | 'amber' | 'error';
  comments: PositionComment[];
}

function DepartmentCard({
  dept,
  isExpanded,
  onToggle,
  onOpenComment,
  getCoverageBadge,
  comments,
}: DepartmentCardProps) {
  const hasVacancies = dept.vacantes > 0;
  const hasUrgentes = dept.urgentes > 0;
  const hasAlert = hasVacancies || hasUrgentes;

  const cardClass = ['dept-card', hasAlert ? 'dept-card--alert' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass} data-area={dept.area}>
      <button
        className="dept-card__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        type="button"
      >
        <div className="dept-card__header-left">
          <h3 className="dept-card__title">{dept.area}</h3>
        </div>
        <div className="dept-card__header-right">
          <Badge variant={getCoverageBadge(dept.porcentaje_cobertura)}>
            {dept.porcentaje_cobertura}%
          </Badge>
          <div className="dept-card__summary">
            <span className="dept-card__summary-item">
              <strong>{dept.plantilla_real}</strong> / {dept.plantilla_autorizada}
            </span>
          </div>
          <CoverageBar
            percentage={dept.porcentaje_cobertura}
            color={getCoverageColor(dept.porcentaje_cobertura)}
            height={6}
            showLabel={false}
          />
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="dept-card__body">
          <div className="dept-card__table-wrapper">
            <table className="dept-card__table">
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  <th scope="col">Sección</th>
                  <th scope="col" className="text-center">Autorizada</th>
                  <th scope="col" className="text-center">Real</th>
                  <th scope="col" className="text-center">Vacantes</th>
                  <th scope="col">Cobertura</th>
                  <th scope="col" className="text-center">Estado</th>
                  <th scope="col" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {dept.puestos.map((pos) => {
                  const posComments = comments.filter(
                    (c) =>
                      c.area === pos.area &&
                      c.seccion === pos.seccion &&
                      c.puesto === pos.puesto
                  );
                  const latestComment = posComments[posComments.length - 1];

                  const rowClass = [
                    pos.vacantes > 0 ? 'row--has-vacancy' : '',
                    pos.urgentes > 0 ? 'row--urgent' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr
                      key={`${pos.area}-${pos.seccion}-${pos.puesto}`}
                      className={rowClass}
                    >
                      <td className="cell-puesto">
                        <div className="cell-puesto__inner">
                          <span className="cell-puesto__name">{pos.puesto}</span>
                          <div className="cell-puesto__flags">
                            {pos.urgentes > 0 && (
                              <Badge variant="error">
                                <AlertCircle size={11} aria-hidden="true" />
                                URGENTE {pos.urgentes}
                              </Badge>
                            )}
                            {pos.excedente_critico > 0 && (
                              <Badge variant="amber">
                                +{pos.excedente_critico} excede
                              </Badge>
                            )}
                            {pos.excedente_backup > 0 && (
                              <Badge variant="teal">
                                <Shield size={11} aria-hidden="true" />
                                +{pos.excedente_backup} back-up
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="cell-seccion">{pos.seccion}</td>
                      <td className="text-center">
                        {pos.plantilla_autorizada}
                        {pos.backup > 0 && (
                          <span className="cell-backup-hint" title={pos.notas ?? 'Buffer de back-up autorizado'}>
                            {' '}+{pos.backup}
                          </span>
                        )}
                      </td>
                      <td className="text-center font-strong">{pos.plantilla_real}</td>
                      <td className="text-center">
                        {pos.vacantes > 0 ? (
                          <span className="vacancy-count">{pos.vacantes}</span>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </td>
                      <td>
                        <CoverageBar
                          percentage={pos.porcentaje_cobertura}
                          color={getCoverageColor(pos.porcentaje_cobertura)}
                          height={6}
                        />
                      </td>
                      <td className="text-center">
                        {latestComment ? (
                          <Badge
                            variant={
                              latestComment.tipo === 'proceso_activo'
                                ? 'amber'
                                : latestComment.tipo === 'entrevista'
                                  ? 'teal'
                                  : latestComment.tipo === 'entrega_documentos'
                                    ? 'coral'
                                    : 'default'
                            }
                          >
                            {COMMENT_TYPE_LABELS[latestComment.tipo]}
                          </Badge>
                        ) : pos.vacantes > 0 ? (
                          <Badge variant="error">Sin proceso</Badge>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onOpenComment(pos.area, pos.seccion, pos.puesto)}
                          title="Agregar comentario"
                          aria-label={`Comentario para ${pos.puesto}`}
                        >
                          <MessageSquare size={16} aria-hidden="true" />
                          {posComments.length > 0 && (
                            <span className="btn-icon__count">{posComments.length}</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
