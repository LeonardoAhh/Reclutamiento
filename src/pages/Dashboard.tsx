import { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ChevronRight,
  HeartPulse,
  Search,
  Filter,
  UserPlus as UserPlusIcon,
  Trash2,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { CoverageBar } from '@/components/ui/CoverageBar';
import { Badge } from '@/components/ui/Badge';
import { CommentModal } from '@/components/ui/CommentModal';
import { JsonImporter } from '@/components/ui/JsonImporter';
import { EmployeeModal } from '@/components/ui/EmployeeModal';
import { AreaDetailModal } from '@/components/ui/AreaDetailModal';
import { IncapacidadModal } from '@/components/ui/IncapacidadModal';
import {
  transformEmployeeData,
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  getCoverageColor,
} from '@/lib/utils';
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
    upsertEmployees,
    addComment,
    addSingleEmployee,
    deleteEmployee,
    updateEmployeeIncapacidad,
  } = useSupabaseData();

  const { coverVacancyForEmployee } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<{
    area: string;
    seccion: string;
    puesto: string;
  } | null>(null);

  // Employee Modal State
  const [empModalMode, setEmpModalMode] = useState<'add' | 'delete' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(null);

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

  // Conteos de empleados en incapacidad por área y por área+sección.
  const { incapacidadPorArea, incapacidadPorAreaSeccion } = useMemo(() => {
    const porArea = new Map<string, number>();
    const porAreaSeccion = new Map<string, Map<string, number>>();
    for (const e of employees) {
      if (!e.en_incapacidad) continue;
      porArea.set(e.area, (porArea.get(e.area) ?? 0) + 1);
      const inner = porAreaSeccion.get(e.area) ?? new Map<string, number>();
      inner.set(e.seccion, (inner.get(e.seccion) ?? 0) + 1);
      porAreaSeccion.set(e.area, inner);
    }
    return { incapacidadPorArea: porArea, incapacidadPorAreaSeccion: porAreaSeccion };
  }, [employees]);

  async function handleImport(rawData: EmployeeRaw[]) {
    // Preserva en_incapacidad / incapacidad_hasta para empleados que ya existían,
    // de modo que un re-import del JSON no borre el estado de incapacidad.
    const prevByNum = new Map(employees.map((e) => [e.num_empleado, e]));
    const transformed = rawData.map((r) => {
      const base = transformEmployeeData(r) as Employee;
      const prev = prevByNum.get(base.num_empleado);
      return prev
        ? {
            ...base,
            en_incapacidad: prev.en_incapacidad ?? false,
            incapacidad_hasta: prev.incapacidad_hasta ?? null,
          }
        : base;
    });
    const incoming = transformed.filter((e) => !prevByNum.has(e.num_empleado));
    await upsertEmployees(transformed);
    for (const emp of incoming) {
      await coverVacancyForEmployee(emp, { source: 'json-import' });
    }
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
                    <span className="emp-name">
                      {emp.nombre}
                      {emp.en_incapacidad && (
                        <Badge variant="amber">
                          <HeartPulse size={11} aria-hidden="true" />
                          INCAPACIDAD
                        </Badge>
                      )}
                    </span>
                    <span className="emp-meta">
                      {emp.puesto} · #{emp.num_empleado}
                    </span>
                  </div>
                  <div className="search-dropdown-item__actions">
                    <button
                      type="button"
                      className={`search-dropdown-item__incapacidad${emp.en_incapacidad ? ' is-active' : ''}`}
                      onClick={() => setIncapacidadTarget(emp)}
                      aria-label={`Marcar incapacidad de ${emp.nombre}`}
                      aria-pressed={Boolean(emp.en_incapacidad)}
                      title={
                        emp.en_incapacidad
                          ? 'Editar / quitar incapacidad'
                          : 'Marcar en incapacidad'
                      }
                    >
                      <HeartPulse size={14} aria-hidden="true" />
                    </button>
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
            onOpen={() => setActiveArea(dept.area)}
            getCoverageBadge={getCoverageBadge}
            incapacidadCount={incapacidadPorArea.get(dept.area) ?? 0}
          />
        ))}
      </section>

      {/* ── Area Detail Modal (Tabs) ── */}
      <AreaDetailModal
        isOpen={activeArea !== null}
        dept={filteredDepts.find((d) => d.area === activeArea) ?? null}
        comments={comments}
        onClose={() => setActiveArea(null)}
        onOpenComment={(area, seccion, puesto) =>
          setCommentTarget({ area, seccion, puesto })
        }
        getCoverageBadge={getCoverageBadge}
        incapacidadPorSeccion={
          activeArea ? incapacidadPorAreaSeccion.get(activeArea) ?? null : null
        }
        incapacidadAreaTotal={
          activeArea ? incapacidadPorArea.get(activeArea) ?? 0 : 0
        }
      />

      {/* ── Incapacidad Modal ── */}
      <IncapacidadModal
        isOpen={incapacidadTarget !== null}
        employee={incapacidadTarget}
        onClose={() => setIncapacidadTarget(null)}
        onSave={updateEmployeeIncapacidad}
      />

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

/* ── Department Card (opens detail modal on click) ── */

interface DepartmentCardProps {
  dept: DepartmentCoverage;
  onOpen: () => void;
  getCoverageBadge: (pct: number) => 'success' | 'teal' | 'amber' | 'error';
  incapacidadCount: number;
}

function DepartmentCard({
  dept,
  onOpen,
  getCoverageBadge,
  incapacidadCount,
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
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Ver detalle de ${dept.area}`}
        type="button"
      >
        <div className="dept-card__header-left">
          <h3 className="dept-card__title">{dept.area}</h3>
          {incapacidadCount > 0 && (
            <Badge variant="amber">
              <HeartPulse size={11} aria-hidden="true" />
              {incapacidadCount} en incapacidad
            </Badge>
          )}
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
          <ChevronRight size={20} aria-hidden="true" />
        </div>
      </button>
    </div>
  );
}
