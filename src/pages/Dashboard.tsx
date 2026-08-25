import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Contact,
  Filter,
  HeartPulse,
  Pencil,
  Trash2,
  UserPlus as UserPlusIcon,
  Users,
} from "lucide-react";
import { Search as SearchData, X as XIconData } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { CoverageBar } from "@/components/ui/CoverageBar";
import {
  AreaStatusBadge,
  Badge,
  IncapacidadBadge,
  ProximoIngresoBadge,
} from "@/components/ui/Badge";
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
  getCoverageColor,
} from "@/lib/utils";
import { localTodayIso, formatShortDate } from "@/lib/dates";
import {
  computeAutoVacancies,
  filterUnreservedVacancies,
} from "@/lib/autoVacancies";
import { notifyResult } from "@/lib/notify";
import { isBoneyardBuild } from "@/lib/boneyard";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useVacancyRequests } from "@/hooks/useVacancyRequests";
import { useCandidates } from "@/hooks/useCandidates";
import { useBajas } from "@/hooks/useBajas";
import { usePositions } from "@/lib/positions";
import type {
  Employee,
  EmployeeRaw,
  PositionComment,
  DepartmentCoverage,
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
          (v) => v.status === "abierta",
        ),
        employees,
        positions,
      ),
    [bajas, employees, positions],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [activeTab, setActiveTab] = useState<string>(() =>
    isBoneyardBuild() &&
    new URLSearchParams(window.location.search).get("view") === "empleados"
      ? "empleados"
      : "general",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    () => !isBoneyardBuild(),
  );
  const [commentTarget, setCommentTarget] = useState<{
    area: string;
    seccion: string;
    puesto: string;
  } | null>(null);

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

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
              p.area.toUpperCase().includes(term),
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
          e.num_empleado.includes(term),
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

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

  const showSearchDropdown =
    matchingEmployees.length > 0 &&
    empModalMode === null &&
    promoteTarget === null &&
    editTarget === null;
  return (
    <div className="config-layout plantilla-layout">
      <aside
        className={`config-sidebar ${!isMobileMenuOpen ? "mobile-hidden" : ""}`}
        aria-label="Menú de Plantilla"
      >
        <nav className="config-sidebar__nav" role="tablist">
          <button
            role="tab"
            id="tab-general"
            aria-selected={activeTab === "general"}
            aria-controls="panel-general"
            className={`config-sidebar__link ${activeTab === "general" ? "active" : ""}`}
            onClick={() => handleTabClick("general")}
          >
            <Users size={18} aria-hidden="true" />
            <span>Departamentos</span>
          </button>
          <button
            role="tab"
            id="tab-empleados"
            aria-selected={activeTab === "empleados"}
            aria-controls="panel-empleados"
            className={`config-sidebar__link ${activeTab === "empleados" ? "active" : ""}`}
            onClick={() => handleTabClick("empleados")}
          >
            <Contact size={18} aria-hidden="true" />
            <span>Empleados</span>
          </button>
        </nav>
      </aside>

      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className={`config-main ${isMobileMenuOpen ? "mobile-hidden" : ""}`}
        aria-label="Contenido principal"
      >
        <button
          className="btn-text config-mobile-back"
          onClick={() => {
            if (activeTab !== "general" && activeTab !== "empleados") {
              setActiveTab("general");
            } else {
              setIsMobileMenuOpen(true);
            }
          }}
          aria-label="Volver"
        >
          <ChevronLeft size={20} />
          <span>Volver</span>
        </button>

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
                    <h1>Plantilla</h1>
                    <div className="config-search dashboard-sidebar__search">
                      <div className="config-search__wrapper dashboard-sidebar__search-wrapper">
                        <label htmlFor="search-input" className="sr-only">
                          Buscar en la plantilla
                        </label>
                        <button
                          type="button"
                          className="dashboard-sidebar__search-icon dashboard-sidebar__search-clear"
                          onClick={() => setSearchTerm("")}
                          disabled={!searchTerm}
                          aria-label={
                            searchTerm ? "Limpiar búsqueda" : "Buscar"
                          }
                          tabIndex={searchTerm ? 0 : -1}
                        >
                          <MorphingIcon
                            icon={searchTerm ? XIconData : SearchData}
                            size={16}
                            className="text-muted"
                            aria-hidden="true"
                          />
                        </button>
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="dashboard__search-input dashboard-sidebar__search-input"
                          autoComplete="off"
                          aria-haspopup="listbox"
                          aria-expanded={showSearchDropdown}
                          aria-label="Buscar en la plantilla"
                        />
                        {showSearchDropdown && (
                          <div
                            className="dashboard__search-dropdown"
                            role="listbox"
                            aria-label="Resultados de búsqueda"
                          >
                            <div
                              className="search-dropdown__head"
                              aria-hidden="true"
                            >
                              Resultados de búsqueda
                            </div>
                            {matchingEmployees.map((emp) => (
                              <div
                                key={emp.num_empleado}
                                className="search-dropdown-item"
                                role="option"
                                aria-selected="false"
                              >
                                <div className="search-dropdown-item__info">
                                  <div
                                    className="search-dropdown-item__avatar"
                                    aria-hidden="true"
                                  >
                                    {emp.nombre
                                      ? emp.nombre.charAt(0).toUpperCase()
                                      : "U"}
                                  </div>
                                  <div className="search-dropdown-item__text">
                                    <span className="emp-name">
                                      {(() => {
                                        const parts = emp.nombre
                                          .trim()
                                          .split(/\s+/);
                                        let apellidos = "";
                                        let nombres = emp.nombre;
                                        const capitalizeWords = (str: string) =>
                                          str
                                            .toLowerCase()
                                            .replace(/\b\w/g, (c) =>
                                              c.toUpperCase(),
                                            );

                                        if (parts.length >= 3) {
                                          apellidos = capitalizeWords(
                                            `${parts[0]} ${parts[1]}`,
                                          );
                                          nombres = capitalizeWords(
                                            parts.slice(2).join(" "),
                                          );
                                        } else if (parts.length === 2) {
                                          apellidos = capitalizeWords(parts[0]);
                                          nombres = capitalizeWords(parts[1]);
                                        } else {
                                          apellidos = "";
                                          nombres = capitalizeWords(
                                            parts[0] || "",
                                          );
                                        }
                                        return (
                                          <>
                                            <span className="emp-name__top">
                                              <span className="emp-name__id">
                                                #{emp.num_empleado}
                                              </span>
                                              {apellidos}
                                            </span>
                                            <span className="emp-name__bottom">
                                              {nombres}
                                              {emp.en_incapacidad && (
                                                <IncapacidadBadge iconOnly />
                                              )}
                                              {String(
                                                emp.fecha_ingreso,
                                              ).localeCompare(localTodayIso()) >
                                                0 && (
                                                <ProximoIngresoBadge iconOnly />
                                              )}
                                            </span>
                                          </>
                                        );
                                      })()}
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
                                    <ArrowUpCircle
                                      size={14}
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    className={`search-dropdown-item__incapacidad${emp.en_incapacidad ? " is-active" : ""}`}
                                    onClick={() => setIncapacidadTarget(emp)}
                                    aria-label={`Marcar incapacidad de ${emp.nombre}`}
                                    aria-pressed={Boolean(emp.en_incapacidad)}
                                    title={
                                      emp.en_incapacidad
                                        ? "Editar / quitar incapacidad"
                                        : "Marcar en incapacidad"
                                    }
                                  >
                                    <HeartPulse size={14} aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="search-dropdown-item__delete"
                                    onClick={() => openDeleteFor(emp)}
                                    aria-label={`Eliminar a ${emp.nombre}`}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
                      <Users size={48} strokeWidth={2.5} />
                      <h2>Sin datos cargados</h2>
                      <p>
                        Importa un archivo JSON o crea un empleado para
                        comenzar.
                      </p>
                    </div>
                  )}

                  {filteredDepts.length === 0 && employees.length > 0 && (
                    <div className="dashboard__empty" id="dashboard-no-results">
                      <MorphingIcon
                        icon={SearchData}
                        size={48}
                        strokeWidth={2.5}
                      />
                      <h2>Sin resultados</h2>
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
                onBack={() => setActiveTab("general")}
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
      </main>
    </div>
  );
}

/* ── Department Card (opens detail modal on click) ── */

interface DepartmentCardProps {
  dept: DepartmentCoverage;
  onOpen: () => void;
  getCoverageBadge: (pct: number) => "success" | "teal" | "amber" | "error";
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

  const cardClass = ["dept-card", hasAlert ? "dept-card--alert" : ""]
    .filter(Boolean)
    .join(" ");

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
            <h2 className="dept-card__title">{dept.area}</h2>
            {incapacidadCount > 0 && (
              <Badge variant="amber" title={`${incapacidadCount} incapacidades`}>
                <HeartPulse size={12} aria-hidden="true" />
                {incapacidadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="dept-card__body">
          <div className="dept-card__progress-label">
            <span>Cobertura</span>
            <span className="dept-card__progress-value">{dept.porcentaje_cobertura}%</span>
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
