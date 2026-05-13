import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { CoverageBar } from '@/components/ui/CoverageBar';
import { Badge } from '@/components/ui/Badge';
import { CommentModal } from '@/components/ui/CommentModal';
import { JsonImporter } from '@/components/ui/JsonImporter';
import {
  transformEmployeeData,
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  getCoverageColor,
} from '@/lib/utils';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { EmployeeModal } from '@/components/ui/EmployeeModal';
import { UserPlus as UserPlusIcon } from 'lucide-react';
import type { Employee, EmployeeRaw, PositionComment, DepartmentCoverage } from '@/lib/types';
import './Dashboard.css';

export function Dashboard() {
  const {
    employees,
    comments,
    loading,
    isConfigured,
    upsertEmployees,
    addComment,
    addSingleEmployee,
    deleteEmployee,
  } = useSupabaseData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    area: string;
    seccion: string;
    puesto: string;
  }>({ isOpen: false, area: '', seccion: '', puesto: '' });

  // Employee Modal State
  const [empModalMode, setEmpModalMode] = useState<'add' | 'delete' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Calculate coverage data
  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments),
    [employees, comments]
  );

  const departmentCoverage = useMemo(
    () => calculateDepartmentCoverage(positionCoverage),
    [positionCoverage]
  );

  // Totals for KPI cards
  const totals = useMemo(() => {
    const autorizada = departmentCoverage.reduce((s, d) => s + d.plantilla_autorizada, 0);
    const real = departmentCoverage.reduce((s, d) => s + d.plantilla_real, 0);
    const vacantes = departmentCoverage.reduce((s, d) => s + d.vacantes, 0);
    const cobertura = autorizada > 0 ? Math.round((real / autorizada) * 100) : 0;
    return { autorizada, real, vacantes, cobertura };
  }, [departmentCoverage]);

  // Filter departments
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

  // Find exact employees based on search term
  const matchingEmployees = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    return employees.filter(e =>
      e.nombre.toUpperCase().includes(term) ||
      e.num_empleado.includes(term)
    ).slice(0, 5); // Show top 5 matches
  }, [employees, searchTerm]);

  // Unique areas for filter dropdown
  const areas = useMemo(
    () => departmentCoverage.map((d) => d.area),
    [departmentCoverage]
  );

  // Import handler
  function handleImport(rawData: EmployeeRaw[]) {
    const transformed = rawData.map((r) => transformEmployeeData(r) as Employee);
    upsertEmployees(transformed);
  }

  // Toggle department expansion
  function toggleDept(area: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  }

  // Expand all
  function expandAll() {
    setExpandedDepts(new Set(areas));
  }

  // Collapse all
  function collapseAll() {
    setExpandedDepts(new Set());
  }

  // Save comment
  function handleSaveComment(comment: PositionComment) {
    addComment(comment);
    setModalState({ isOpen: false, area: '', seccion: '', puesto: '' });
  }

  // Get badge variant from coverage percentage
  function getCoverageBadge(pct: number) {
    if (pct >= 100) return 'success' as const;
    if (pct >= 75) return 'teal' as const;
    if (pct >= 50) return 'amber' as const;
    return 'error' as const;
  }

  // Handle saving new employee
  function handleSaveEmployee(emp: Employee) {
    addSingleEmployee(emp);
    setEmpModalMode(null);
  }

  // Handle deleting employee
  function handleDeleteEmployee(num_empleado: string) {
    deleteEmployee(num_empleado);
    setEmpModalMode(null);
    setSearchTerm(''); // Clear search to hide dropdown
  }

  if (loading) {
    return (
      <main className="dashboard container" id="dashboard-main">
        <section className="dashboard__hero" id="dashboard-hero">
          <div className="dashboard__hero-content">
            <h1>Control de Plantilla</h1>
            <p className="dashboard__hero-sub">Cargando datos...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard container" id="dashboard-main">
      {/* ── Hero Band ── */}
      <section className="dashboard__hero" id="dashboard-hero">
        <div className="dashboard__hero-content">
          <h1>Control de Plantilla</h1>
          <div className="dashboard__hero-status">
            <Badge variant={isConfigured ? 'success' : 'amber'}>
              {isConfigured ? 'Conectado a base de datos' : 'Sin conexión'}
            </Badge>
          </div>
        </div>
        <div className="dashboard__hero-actions">
          <button
            className="btn-primary"
            onClick={() => { setSelectedEmployee(null); setEmpModalMode('add'); }}
          >
            <UserPlusIcon size={16} />
            Nuevo Empleado
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
        <div className="dashboard__search" style={{ position: 'relative' }}>
          <Search size={16} className="dashboard__search-icon" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar empleado, puesto, sección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard__search-input"
            autoComplete="off"
          />
          {matchingEmployees.length > 0 && (
            <div className="dashboard__search-dropdown">
              {matchingEmployees.map(emp => (
                <button
                  key={emp.num_empleado}
                  className="search-dropdown-item"
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setEmpModalMode('delete');
                  }}
                >
                  <span className="emp-name">{emp.nombre}</span>
                  <span className="emp-meta">{emp.puesto} | #{emp.num_empleado}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard__filter">
          <Filter size={16} />
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
            className="btn-text"
            onClick={expandAll}
          >
            Expandir todo
          </button>
          <span className="dashboard__separator">|</span>
          <button
            id="btn-collapse-all"
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
            <p>Importa un archivo JSON con datos de empleados para comenzar.</p>
          </div>
        )}

        {filteredDepts.length === 0 && employees.length > 0 && (
          <div className="dashboard__empty" id="dashboard-no-results">
            <Search size={48} strokeWidth={1} />
            <h3>Sin resultados</h3>
            <p>No se encontraron coincidencias para tu búsqueda.</p>
          </div>
        )}

        {filteredDepts.map((dept: DepartmentCoverage) => (
          <DepartmentCard
            key={dept.area}
            dept={dept}
            isExpanded={expandedDepts.has(dept.area)}
            onToggle={() => toggleDept(dept.area)}
            onOpenComment={(area: string, seccion: string, puesto: string) =>
              setModalState({ isOpen: true, area, seccion, puesto })
            }
            getCoverageBadge={getCoverageBadge}
            comments={comments}
          />
        ))}
      </section>

      {/* ── Comment Modal ── */}
      <CommentModal
        isOpen={modalState.isOpen}
        area={modalState.area}
        seccion={modalState.seccion}
        puesto={modalState.puesto}
        existingComments={comments.filter(
          (c) =>
            c.area === modalState.area &&
            c.seccion === modalState.seccion &&
            c.puesto === modalState.puesto
        )}
        onClose={() => setModalState({ isOpen: false, area: '', seccion: '', puesto: '' })}
        onSave={handleSaveComment}
      />

      {/* ── Employee Modal (Add / Delete) ── */}
      <EmployeeModal
        isOpen={empModalMode !== null}
        mode={empModalMode || 'add'}
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

  return (
    <div className="dept-card" data-area={dept.area}>
      <button
        className="dept-card__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="dept-card__header-left">
          <h3 className="dept-card__title">{dept.area}</h3>
          <div className="dept-card__meta">
            <Badge variant={getCoverageBadge(dept.porcentaje_cobertura)}>
              {dept.porcentaje_cobertura}%
            </Badge>
            {hasVacancies && (
              <Badge variant="error">{dept.vacantes} vacante{dept.vacantes > 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>
        <div className="dept-card__header-right">
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
                  <th>Puesto</th>
                  <th>Sección</th>
                  <th className="text-center">Autorizada</th>
                  <th className="text-center">Real</th>
                  <th className="text-center">Vacantes</th>
                  <th>Cobertura</th>
                  <th className="text-center">Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dept.puestos.map((pos) => {
                  const posComments = comments.filter(
                    (c) => c.area === pos.area && c.seccion === pos.seccion && c.puesto === pos.puesto
                  );
                  const latestComment = posComments[posComments.length - 1];

                  return (
                    <tr key={`${pos.area}-${pos.seccion}-${pos.puesto}`} className={pos.vacantes > 0 ? 'row--has-vacancy' : ''}>
                      <td className="cell-puesto">{pos.puesto}</td>
                      <td className="cell-seccion">{pos.seccion}</td>
                      <td className="text-center">{pos.plantilla_autorizada}</td>
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
                          className="btn-icon"
                          onClick={() => onOpenComment(pos.area, pos.seccion, pos.puesto)}
                          title="Agregar comentario"
                          aria-label={`Comentario para ${pos.puesto}`}
                        >
                          <MessageSquare size={16} />
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
