import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  CircleCheckBig,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  UserRoundPlus as UserPlusIcon,
  UsersRound,
} from "lucide-react";
import { Search as SearchData } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { SearchField } from "@/components/ui/SearchField";
import { DepartmentSearchResults } from "@/components/plantilla/DepartmentSearchResults";
import { DepartmentCard } from "@/components/plantilla/DepartmentCard";
import { CommentModal } from "@/components/ui/CommentModal";
import { JsonImporter } from "@/components/ui/JsonImporter";
import { VacancyReportModal } from "@/components/ui/VacancyReportModal";
import { EmployeeModal } from "@/components/ui/EmployeeModal";
import { EditEmployeeModal } from "@/components/ui/EditEmployeeModal";
import { AreaDetailView } from "@/components/ui/AreaDetailView";
import { EmpleadosView } from "@/pages/plantilla-views/EmpleadosView";
import { IncapacidadModal } from "@/components/ui/IncapacidadModal";
import Avatar from "boring-avatars";
import { PromoteEmployeeModal } from "@/components/ui/PromoteEmployeeModal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import {
  transformEmployeeData,
  calculatePositionCoverage,
  calculateDepartmentCoverage,
  normalizeString,
} from "@/lib/utils";
import { formatShortDate, localTodayIso } from "@/lib/dates";
import { calculateWorkforceProjection } from "@/lib/workforceProjection";
import { useDismissedPositions } from "@/hooks/useDismissedPositions";
import { getPlantillaView } from "@/lib/plantillaNavigation";
import {
  computeAutoVacancies,
  filterUnreservedVacancies,
} from "@/lib/autoVacancies";
import { notifyResult } from "@/lib/notify";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useVacancyRequests } from "@/hooks/useVacancyRequests";
import { useCandidates } from "@/hooks/useCandidates";
import { useBajas } from "@/hooks/useBajas";
import { usePositions } from "@/lib/positions";
import type {
  Employee,
  EmployeeRaw,
  PositionComment,
} from "@/lib/types";
import "./Dashboard.css";

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
    purgeAllEmployees,
  } = useSupabaseData();

  const { coverVacancyForEmployee } = useVacancyRequests({ loadHistory: false });
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
          (v) => v.status === "abierta",
        ),
        employees,
        positions,
      ),
    [bajas, employees, positions],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const location = useLocation();
  const primaryView = getPlantillaView(location.pathname);
  const [departmentSelection, setDepartmentSelection] = useState<{
    area: string;
    navigationKey: string;
  } | null>(null);
  const activeTab = primaryView === "empleados"
    ? "empleados"
    : departmentSelection?.navigationKey === location.key
      ? departmentSelection.area
      : "general";
  const [commentTarget, setCommentTarget] = useState<{
    area: string;
    seccion: string;
    puesto: string;
  } | null>(null);

  // Employee Modal State
  const [empModalMode, setEmpModalMode] = useState<"add" | "delete" | null>(
    null,
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(
    null,
  );
  const [promoteTarget, setPromoteTarget] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [vacancyReportOpen, setVacancyReportOpen] = useState(false);

  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments, positions),
    [employees, comments, positions],
  );

  const departmentCoverage = useMemo(
    () => calculateDepartmentCoverage(positionCoverage),
    [positionCoverage],
  );

  const { dismissedKeys } = useDismissedPositions();
  const todayIso = localTodayIso();
  const departmentProjections = useMemo(
    () => new Map(departmentCoverage.map(({ area }) => [
      area,
      calculateWorkforceProjection(employees, positions, todayIso, dismissedKeys, area),
    ])),
    [departmentCoverage, employees, positions, todayIso, dismissedKeys],
  );

  const normalizedSearchTerm = normalizeString(searchTerm);
  const hasSearchQuery = normalizedSearchTerm.length >= 2;

  const filteredDepts = useMemo(() => {
    let result = departmentCoverage;
    if (filterArea) {
      result = result.filter((d) => d.area === filterArea);
    }
    if (hasSearchQuery) {
      result = result
        .map((dept) => ({
          ...dept,
          puestos: dept.puestos.filter(
            (p) =>
              normalizeString(p.puesto).includes(normalizedSearchTerm) ||
              normalizeString(p.seccion).includes(normalizedSearchTerm) ||
              normalizeString(p.area).includes(normalizedSearchTerm),
          ),
        }))
        .filter((dept) => dept.puestos.length > 0);
    }
    return result;
  }, [departmentCoverage, filterArea, hasSearchQuery, normalizedSearchTerm]);

  const matchingEmployees = useMemo(() => {
    if (!hasSearchQuery) return [];
    return employees
      .filter(
        (e) =>
          (!filterArea || e.area === filterArea) &&
          (normalizeString(e.nombre).includes(normalizedSearchTerm) ||
            normalizeString(e.num_empleado).includes(normalizedSearchTerm)),
      );
  }, [employees, filterArea, hasSearchQuery, normalizedSearchTerm]);

  const areas = useMemo(
    () => departmentCoverage.map((d) => d.area),
    [departmentCoverage],
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
    return {
      incapacidadPorArea: porArea,
      incapacidadPorAreaSeccion: porAreaSeccion,
    };
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
      await coverVacancyForEmployee(emp, { source: "json-import" });
    }
  }

  function handleSaveComment(comment: PositionComment) {
    addComment(comment);
    setCommentTarget(null);
  }

  function getCoverageBadge(pct: number) {
    if (pct >= 100) return "success" as const;
    if (pct >= 75) return "teal" as const;
    if (pct >= 50) return "amber" as const;
    return "error" as const;
  }

  async function handleSaveEmployee(emp: Employee) {
    const result = await addSingleEmployee(emp);
    if (result.ok) {
      await coverVacancyForEmployee(emp, { source: "dashboard-add" });
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
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string },
  ) {
    const result = await deleteEmployee(num_empleado, bajaData);
    if (result.ok) {
      setSearchTerm("");
    }
    return result;
  }

  function openDeleteFor(emp: Employee) {
    setSelectedEmployee(emp);
    setEmpModalMode("delete");
  }

  function openEditFor(emp: Employee) {
    setEditTarget(emp);
  }

  async function handleUpdateEmployee(
    num_empleado: string,
    fields: Partial<
      Pick<
        Employee,
        | "nombre"
        | "area"
        | "seccion"
        | "puesto"
        | "categoria"
        | "turno"
        | "fecha_ingreso"
        | "ruta"
        | "parada"
      >
    >,
  ) {
    const result = await updateEmployee(num_empleado, fields);
    if (result.ok) {
      setSearchTerm("");
    }
    return result;
  }

  function openPromoteFor(emp: Employee) {
    setPromoteTarget(emp);
  }

  async function handlePromote(
    emp: Employee,
    target: { area: string; seccion: string; puesto: string },
  ): Promise<{ ok: boolean; message?: string }> {
    const result = await promoteEmployee(emp.num_empleado, target);
    if (result.ok) {
      // Si la promoción cubre una vacante abierta del nuevo puesto, ciérrala.
      await coverVacancyForEmployee(
        { ...emp, ...target },
        { source: "dashboard-promote" },
      );
      // Además, si había una baja abierta del mismo puesto (la que dejó
      // libre el cupo que estamos llenando), márcala cubierta también.
      // El auto-match de bajas.ts requiere `empleado.fecha_ingreso >=
      // baja.fecha_baja` dentro de 10d; una promoción conserva el
      // `fecha_ingreso` original, así que nunca dispara ese match.
      await coverBajaForPosition(target, {
        num_empleado: emp.num_empleado,
        source: "dashboard-promote",
      });
      setSearchTerm("");
    }
    return result;
  }

  const hasSearchResults = matchingEmployees.length > 0 || filteredDepts.length > 0;

  return (
    <main className="plantilla-layout container" aria-labelledby="plantilla-title">
      <header className="plantilla-header">
        <h1 id="plantilla-title" className="plantilla-header__title">
          {primaryView === "empleados" ? "Empleados" : "Plantilla"}
        </h1>
      </header>

      <section
        className="plantilla-main"
        aria-label="Contenido principal"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="dashboard__content-area"
          >
            {activeTab === "general" && (
              <BoneyardSkeleton
                name="plantilla-page"
                loading={loading && employees.length === 0}
                loadingLabel="Cargando plantilla…"
              >
                <header className="dashboard__hero dashboard-sidebar__hero">
                  <div className="dashboard__hero-content dashboard-sidebar__hero-content">
                    <div
                      className="dashboard-sidebar__search"
                      role="search"
                      aria-label="Buscar en departamentos"
                    >
                      <div className="dashboard-sidebar__search-wrapper">
                        <SearchField
                          id="search-input"
                          className="dashboard-sidebar__search-field"
                          label="Buscar en la plantilla"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          onClear={() => setSearchTerm("")}
                          autoComplete="off"
                          aria-controls="dashboard-departments"
                        />
                      </div>
                    </div>

                    <div className="dashboard__hero-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEmpModalMode("add");
                        }}
                        title="Nuevo empleado"
                      >
                        <UserPlusIcon size={16} aria-hidden="true" />
                        <span className="dashboard__report-btn-label">
                          Nuevo
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary dashboard__report-btn"
                        onClick={() => setVacancyReportOpen(true)}
                        title="Resumen de vacantes"
                      >
                        <ClipboardList size={16} aria-hidden="true" />
                        <span className="dashboard__report-btn-label">
                          Reporte
                        </span>
                      </button>
                    </div>
                  </div>
                </header>
                <section
                  className="dashboard__departments"
                  id="dashboard-departments"
                >
                  {filteredDepts.length === 0 && employees.length === 0 && (
                    <div className="dashboard__empty" id="dashboard-empty">
                      <UsersRound size={48} strokeWidth={2.5} />
                      <h2>Sin datos cargados</h2>
                      <p>
                        Importa un archivo JSON o crea un empleado para
                        comenzar.
                      </p>
                    </div>
                  )}

                  {employees.length > 0 && normalizedSearchTerm.length === 1 && (
                    <p className="dashboard__search-hint" role="status">
                      Escribe al menos 2 caracteres para buscar.
                    </p>
                  )}

                  {hasSearchQuery && matchingEmployees.length > 0 && (
                    <DepartmentSearchResults
                      employees={matchingEmployees}
                      onEdit={openEditFor}
                      onPromote={openPromoteFor}
                      onIncapacidad={setIncapacidadTarget}
                      onDelete={openDeleteFor}
                    />
                  )}

                  {hasSearchQuery && filteredDepts.length > 0 && (
                    <header className="dashboard__department-match-heading">
                      <h2>Departamentos y puestos</h2>
                      <span>
                        {filteredDepts.length}{' '}
                        {filteredDepts.length === 1 ? 'coincidencia' : 'coincidencias'}
                      </span>
                    </header>
                  )}

                  {hasSearchQuery && !hasSearchResults && employees.length > 0 && (
                    <div className="dashboard__empty" id="dashboard-no-results">
                      <MorphingIcon
                        icon={SearchData}
                        size={48}
                        strokeWidth={2.5}
                      />
                      <h2>Sin resultados</h2>
                      <p>No se encontraron coincidencias para tu búsqueda.</p>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSearchTerm("")}
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  )}

                  {!hasSearchQuery &&
                    filteredDepts.length === 0 &&
                    employees.length > 0 && (
                      <div className="dashboard__empty" id="dashboard-no-results">
                        <MorphingIcon
                          icon={SearchData}
                          size={48}
                          strokeWidth={2.5}
                        />
                        <h2>Sin resultados</h2>
                        <p>No hay departamentos que coincidan con el filtro.</p>
                      </div>
                    )}

                  {filteredDepts.map((dept) => (
                    <DepartmentCard
                      key={dept.area}
                      area={dept.area}
                      projection={departmentProjections.get(dept.area)}
                      onOpen={() => setDepartmentSelection({ area: dept.area, navigationKey: location.key })}
                      incapacidadCount={incapacidadPorArea.get(dept.area) ?? 0}
                    />
                  ))}
                </section>
              </BoneyardSkeleton>
            )}
            {activeTab === "empleados" && <EmpleadosView />}
            {activeTab !== "general" && activeTab !== "empleados" && (
              <AreaDetailView
                dept={filteredDepts.find((d) => d.area === activeTab) ?? null}
                comments={comments}
                candidates={candidates}
                onOpenComment={(area, seccion, puesto) =>
                  setCommentTarget({ area, seccion, puesto })
                }
                onBack={() => setDepartmentSelection(null)}
                getCoverageBadge={getCoverageBadge}
                incapacidadPorSeccion={
                  activeTab !== "general"
                    ? (incapacidadPorAreaSeccion.get(activeTab) ?? null)
                    : null
                }
                incapacidadAreaTotal={
                  activeTab !== "general"
                    ? (incapacidadPorArea.get(activeTab) ?? 0)
                    : 0
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
          area={commentTarget?.area ?? ""}
          seccion={commentTarget?.seccion ?? ""}
          puesto={commentTarget?.puesto ?? ""}
          existingComments={comments.filter(
            (c) =>
              commentTarget !== null &&
              c.area === commentTarget.area &&
              c.seccion === commentTarget.seccion &&
              c.puesto === commentTarget.puesto,
          )}
          onClose={() => setCommentTarget(null)}
          onSave={handleSaveComment}
        />

        {/* ── Employee Modal (Add / Delete) ── */}
        <EmployeeModal
          isOpen={empModalMode !== null}
          mode={empModalMode ?? "add"}
          employee={selectedEmployee}
          onClose={() => setEmpModalMode(null)}
          onSave={handleSaveEmployee}
          onDelete={handleDeleteEmployee}
          openVacancies={openVacancies}
          existingEmployees={employees}
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
      </section>
    </main>
  );
}
