import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ChevronRight,
  HeartPulse,
  Search,
  Filter,
  UserPlus as UserPlusIcon,
  Trash2,
  ArrowUpCircle,
  Pencil,
  ClipboardList,
  Clock,
  Contact,
} from 'lucide-react';
import { CoverageBar } from '@/components/ui/CoverageBar';
import { Badge } from '@/components/ui/Badge';
import { CommentModal } from '@/components/ui/CommentModal';
import { JsonImporter } from '@/components/ui/JsonImporter';
import { TurnosImporter } from '@/components/turnos/TurnosImporter';
import { EmployeeModal } from '@/components/ui/EmployeeModal';
import { EditEmployeeModal } from '@/components/ui/EditEmployeeModal';
import { AreaDetailView } from '@/components/ui/AreaDetailView';
import { EmpleadosView } from '@/pages/plantilla-views/EmpleadosView';
import { IncapacidadModal } from '@/components/ui/IncapacidadModal';
import Avatar from 'boring-avatars';
import { PromoteEmployeeModal } from '@/components/ui/PromoteEmployeeModal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { VacancyReportModal } from '@/components/ui/VacancyReportModal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  transformEmployeeData,
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  getCoverageColor,
} from '@/lib/utils';
import { localTodayIso, formatShortDate } from '@/lib/dates';
import { computeAutoVacancies, filterUnreservedVacancies } from '@/lib/autoVacancies';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useCandidates } from '@/hooks/useCandidates';
import { useBajas } from '@/hooks/useBajas';
import { usePositions } from '@/lib/positions';
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
    updateEmployee,
    deleteEmployee,
    updateEmployeeIncapacidad,
    promoteEmployee,
    coverBajaForPosition,
    assignTurnos,
  } = useSupabaseData();

  const { coverVacancyForEmployee } = useVacancyRequests();
  const { positions, createPosition } = usePositions();
  const { bajas } = useBajas();
  // Pipeline completo. Se pasa a `AreaDetailModal` para contar candidatos
  // activos por (área, sección, puesto) y reflejar "EN PROCESO (N)" en el
  // detalle de área en lugar de "Sin proceso" cuando hay procesos reales.
  const { candidates } = useCandidates();

  // Vacantes abiertas detectadas automáticamente, excluyendo las que ya están
  // reservadas por un empleado con fecha de ingreso futura (próximo ingreso),
  // para no ofrecer en el alta un puesto ya comprometido.
  const openVacancies = useMemo(
    () =>
      filterUnreservedVacancies(
        computeAutoVacancies(bajas, employees, positions).filter(
          (v) => v.status === 'abierta'
        ),
        employees,
        positions
      ),
    [bajas, employees, positions]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [activeTab, setActiveTab] = useState<string>('general');
  const [commentTarget, setCommentTarget] = useState<{
    area: string;
    seccion: string;
    puesto: string;
  } | null>(null);

  // Employee Modal State
  const [empModalMode, setEmpModalMode] = useState<'add' | 'delete' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [vacancyReportOpen, setVacancyReportOpen] = useState(false);
  const [turnosImporterOpen, setTurnosImporterOpen] = useState(false);

  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments, positions),
    [employees, comments, positions]
  );

  const departmentCoverage = useMemo(
    () => calculateDepartmentCoverage(positionCoverage),
    [positionCoverage]
  );

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

  /**
   * Recibe `bajaData` desde el modal de baja y se lo reenvía al hook,
   * para que se inserte el registro correspondiente en la tabla `bajas`
   * (y se refleje en `/bajas`). Antes se ignoraba el argumento extra y la
   * baja nunca se persistía.
   */
  async function handleDeleteEmployee(
    num_empleado: string,
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string }
  ) {
    const result = await deleteEmployee(num_empleado, bajaData);
    if (result.ok) {
      setSearchTerm('');
    }
    return result;
  }

  function openDeleteFor(emp: Employee) {
    setSelectedEmployee(emp);
    setEmpModalMode('delete');
  }

  function openEditFor(emp: Employee) {
    setEditTarget(emp);
  }

  async function handleUpdateEmployee(
    num_empleado: string,
    fields: Partial<Pick<Employee, 'nombre' | 'area' | 'seccion' | 'puesto' | 'categoria' | 'turno' | 'fecha_ingreso' | 'ruta' | 'parada'>>
  ) {
    const result = await updateEmployee(num_empleado, fields);
    if (result.ok) {
      setSearchTerm('');
    }
    return result;
  }

  function openPromoteFor(emp: Employee) {
    setPromoteTarget(emp);
  }

  async function handlePromote(
    emp: Employee,
    target: { area: string; seccion: string; puesto: string }
  ): Promise<{ ok: boolean; message?: string }> {
    const result = await promoteEmployee(emp.num_empleado, target);
    if (result.ok) {
      // Si la promoción cubre una vacante abierta del nuevo puesto, ciérrala.
      await coverVacancyForEmployee(
        { ...emp, ...target },
        { source: 'dashboard-promote' }
      );
      // Además, si había una baja abierta del mismo puesto (la que dejó
      // libre el cupo que estamos llenando), márcala cubierta también.
      // El auto-match de bajas.ts requiere `empleado.fecha_ingreso >=
      // baja.fecha_baja` dentro de 10d; una promoción conserva el
      // `fecha_ingreso` original, así que nunca dispara ese match.
      await coverBajaForPosition(target, {
        num_empleado: emp.num_empleado,
        source: 'dashboard-promote',
      });
      setSearchTerm('');
    }
    return result;
  }

  if (loading && employees.length === 0) {
    return (
      <main className="dashboard container" id="dashboard-main">
        <section className="dashboard__hero" id="dashboard-hero">
          <div className="dashboard__hero-content">
            <h1>Plantilla</h1>
          </div>
        </section>
        <section className="dashboard__controls">
          <Skeleton
            height={40}
            radius="var(--rounded-md)"
            style={{ flex: '1 1 260px' }}
          />
          <Skeleton height={40} width={140} radius="var(--rounded-md)" />
        </section>
        <section className="dashboard__departments">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={150} radius="var(--rounded-lg)" />
          ))}
        </section>
      </main>
    );
  }

  const showSearchDropdown =
    matchingEmployees.length > 0 &&
    empModalMode === null &&
    promoteTarget === null &&
    editTarget === null;

  return (
    <div className="config-layout plantilla-layout">
      <aside className="config-sidebar" aria-label="Menú de Plantilla">
        <header className="config-sidebar__header" style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-xs)', flexWrap: 'wrap', width: '100%' }}>
            <h1 className="type-heading-sm m-0" style={{flex: 1}}>Plantilla</h1>
            <div className="dashboard__hero-actions" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSelectedEmployee(null);
                  setEmpModalMode('add');
                }}
                title="Nuevo empleado"
                style={{ padding: '0 var(--spacing-sm)' }}
              >
                <UserPlusIcon size={16} aria-hidden="true" />
              </button>
              <span style={{ display: 'none' }}>
                <JsonImporter onImport={handleImport} />
              </span>
              <motion.button
                type="button"
                className="btn-secondary dashboard__report-btn"
                onClick={() => setTurnosImporterOpen(true)}
                title="Importar turnos por clave de horario"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '0 var(--spacing-sm)' }}
              >
                <Clock size={16} aria-hidden="true" />
              </motion.button>
              <motion.button
                type="button"
                className="btn-secondary dashboard__report-btn"
                onClick={() => setVacancyReportOpen(true)}
                title="Resumen de vacantes"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '0 var(--spacing-sm)' }}
              >
                <ClipboardList size={16} aria-hidden="true" />
              </motion.button>
            </div>
          </div>
        </header>

        <div className="config-search" style={{ padding: '0 var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <div className="config-search__wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: 'var(--spacing-sm)', pointerEvents: 'none' }} aria-hidden="true" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard__search-input"
              style={{ width: '100%', paddingLeft: 'calc(var(--spacing-lg) + var(--spacing-xs))' }}
              autoComplete="off"
              aria-haspopup="listbox"
              aria-expanded={showSearchDropdown}
              aria-label="Buscar en la plantilla"
            />
          </div>
          {showSearchDropdown && (
            <div className="dashboard__search-dropdown" role="listbox" aria-label="Resultados de búsqueda">
              <div className="search-dropdown__head" aria-hidden="true">Resultados de búsqueda</div>
              {matchingEmployees.map((emp) => (
                <div key={emp.num_empleado} className="search-dropdown-item" role="option" aria-selected="false">
                  <div className="search-dropdown-item__info">
                    <div className="search-dropdown-item__avatar" aria-hidden="true">
                      <Avatar
                        size={32}
                        name={emp.nombre}
                        variant="beam"
                        colors={['#0F172A', '#334155', '#3B82F6', '#06B6D4', '#F8FAFC']}
                      />
                    </div>
                    <div className="search-dropdown-item__text">
                      <span className="emp-name">
                        {emp.nombre}
                        {emp.en_incapacidad && (
                          <Badge variant="amber">
                            <HeartPulse size={11} aria-hidden="true" />
                            INCAPACIDAD
                          </Badge>
                        )}
                        {String(emp.fecha_ingreso).localeCompare(localTodayIso()) > 0 && (
                          <Badge variant="coral">
                            PRÓXIMO INGRESO
                          </Badge>
                        )}
                      </span>
                      <span className="emp-meta">
                        {emp.puesto} {emp.seccion ? `(${emp.seccion})` : ''} • Turno {emp.turno || 'Sin asignar'} • #{emp.num_empleado}
                      </span>
                    </div>
                  </div>
                  <div className="search-dropdown-item__actions">
                    <button
                      type="button"
                      className="search-dropdown-item__edit"
                      onClick={() => openEditFor(emp)}
                      aria-label={`Editar a ${emp.nombre}`}
                      title="Editar empleado"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="search-dropdown-item__promote"
                      onClick={() => openPromoteFor(emp)}
                      aria-label={`Promover a ${emp.nombre}`}
                      title="Promover a otro puesto"
                    >
                      <ArrowUpCircle size={14} aria-hidden="true" />
                    </button>
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

        <nav className="config-sidebar__nav">
          <button
            className={`config-sidebar__link ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Users size={18} aria-hidden="true" />
            <span>Plantilla Activa</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'empleados' ? 'active' : ''}`}
            onClick={() => setActiveTab('empleados')}
          >
            <Contact size={18} aria-hidden="true" />
            <span>Empleados</span>
          </button>
        </nav>
      </aside>

      <main className="config-main" aria-label="Contenido principal">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', padding: 'var(--spacing-md)' }}
          >
            {activeTab === 'general' && (
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
            onOpen={() => setActiveTab(dept.area)}
            getCoverageBadge={getCoverageBadge}
            incapacidadCount={incapacidadPorArea.get(dept.area) ?? 0}
          />
        ))}
      </section>
            )}
            {activeTab === 'empleados' && <EmpleadosView />}
            {activeTab !== 'general' && activeTab !== 'empleados' && (
              <AreaDetailView
                dept={filteredDepts.find((d) => d.area === activeTab) ?? null}
                comments={comments}
                candidates={candidates}
                onOpenComment={(area, seccion, puesto) =>
                  setCommentTarget({ area, seccion, puesto })
                }
                onBack={() => setActiveTab('general')}
                getCoverageBadge={getCoverageBadge}
                incapacidadPorSeccion={
                  activeTab !== 'general' ? incapacidadPorAreaSeccion.get(activeTab) ?? null : null
                }
                incapacidadAreaTotal={
                  activeTab !== 'general' ? incapacidadPorArea.get(activeTab) ?? 0 : 0
                }
              />
            )}
          </motion.div>
        </AnimatePresence>

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
        openVacancies={openVacancies}
      />

      {/* ── Edit Employee Modal ── */}
      <EditEmployeeModal
        isOpen={editTarget !== null}
        employee={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateEmployee}
      />

      {/* ── Promote Employee Modal ── */}
      <PromoteEmployeeModal
        isOpen={promoteTarget !== null}
        employee={promoteTarget}
        onClose={() => setPromoteTarget(null)}
        onPromote={handlePromote}
        onCreatePosition={createPosition}
      />

      {/* ── Vacancy Report Modal (WhatsApp-ready) ── */}
      <VacancyReportModal
        isOpen={vacancyReportOpen}
        onClose={() => setVacancyReportOpen(false)}
        positions={positionCoverage}
      />

      {/* ── Turnos Importer (clave de horario por num_empleado) ── */}
      <TurnosImporter
        isOpen={turnosImporterOpen}
        onClose={() => setTurnosImporterOpen(false)}
        employees={employees}
        onConfirm={assignTurnos}
      />
      </main>
    </div>
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
    <article className={cardClass} data-area={dept.area}>
      <button
        className="dept-card__button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Ver detalle de ${dept.area}`}
        type="button"
      >
        <div className="dept-card__header">
          <div className="dept-card__header-left">
            <h3 className="dept-card__title">{dept.area}</h3>
            {incapacidadCount > 0 && (
              <Badge variant="amber">
                <HeartPulse size={11} aria-hidden="true" />
                {incapacidadCount}
              </Badge>
            )}

          </div>
          <div className="dept-card__header-right">
            <Badge variant={getCoverageBadge(dept.porcentaje_cobertura)}>
              {dept.porcentaje_cobertura}%
            </Badge>
            {hasVacancies && (
              <span className="dept-card__vacancy-badge">{dept.vacantes} vacantes</span>
            )}
          </div>
        </div>

        <div className="dept-card__body">
          <div className="dept-card__body-row">
            <span className="dept-card__stat-label">Real / Aut.</span>
            <span className="dept-card__stat-value">
              {dept.plantilla_real} / {dept.plantilla_autorizada}
            </span>
          </div>
          <div className="dept-card__body-row">
            <span className="dept-card__stat-label">Urgentes</span>
            <span className="dept-card__stat-value">
              {dept.urgentes || '—'}
            </span>
          </div>
          <CoverageBar
            percentage={dept.porcentaje_cobertura}
            color={getCoverageColor(dept.porcentaje_cobertura)}
            height={6}
            showLabel={false}
          />
        </div>
      </button>
    </article>
  );
}
