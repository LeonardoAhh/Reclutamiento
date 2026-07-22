import { useEffect, useMemo, useState } from 'react';
import { Users, Search, HeartPulse, CloudOff, ChevronDown } from 'lucide-react';
import { EditEmployeeModal } from '@/components/ui/EditEmployeeModal';
import { Badge, StarliteBadge } from '@/components/ui/Badge';
import { IncapacidadModal } from '@/components/ui/IncapacidadModal';
import { DeleteEmployeeConfirmModal } from '@/components/ui/DeleteEmployeeConfirmModal';
import { EmployeeRowActions } from '@/components/ui/EmployeeRowActions';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable, SkeletonCardList } from '@/components/ui/PageSkeletons';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatShortDate } from '@/lib/dates';
import { notifyResult } from '@/lib/notify';
import type { Employee } from '@/lib/types';
import './Empleados.css';

/**
 * Compara números de empleado de forma numérica cuando ambos son numéricos;
 * cae a comparación textual (locale) en otro caso. Los datos de RH suelen
 * traer números puros, pero algunos vienen con prefijos.
 */
function compareNumEmpleado(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b, 'es', { numeric: true });
}

interface DepartmentGroup {
  area: string;
  empleados: Employee[];
}

interface EmployeeActionHandlers {
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onIncapacidad: (emp: Employee) => void;
}

/** Lista de tarjetas de empleados, diseño minimalista grid-first. */
function EmployeeCards({
  empleados,
  handlers,
}: {
  empleados: Employee[];
  handlers: EmployeeActionHandlers;
}) {
  return (
    <ul className="empleados__grid-list" role="list">
      {empleados.map((emp) => (
        <li
          key={emp.id ?? emp.num_empleado}
          className={`empleados__grid-item${
            emp.en_incapacidad ? ' empleados__grid-item--incapacidad' : ''
          }`}
        >
          <span className="empleados__cell-num">{emp.num_empleado}</span>
          <div className="empleados__grid-info">
            <span className="empleados__name">{emp.nombre}</span>
            <span className="empleados__puesto">
              {emp.puesto}
            </span>
            {emp.seccion && (
              <span className="empleados__seccion">
                {emp.seccion}
              </span>
            )}
            {emp.en_incapacidad && (
              <span
                className="empleados__incapacidad-tag"
                title={
                  emp.incapacidad_hasta
                    ? `Incapacidad hasta ${formatShortDate(emp.incapacidad_hasta)}`
                    : 'En incapacidad médica'
                }
              >
                <HeartPulse size={10} aria-hidden="true" />
                Incapacidad
              </span>
            )}
            {emp.is_starlite && (
              <div className="empleados-table__cell-badge" style={{ marginTop: 'var(--spacing-xxs)' }}>
                <StarliteBadge />
              </div>
            )}
          </div>
          <EmployeeRowActions
            employee={emp}
            onEdit={handlers.onEdit}
            onDelete={handlers.onDelete}
            onIncapacidad={handlers.onIncapacidad}
          />
        </li>
      ))}
    </ul>
  );
}



export function EmpleadosView() {
  const {
    employees,
    loading,
    isConfigured,
    updateEmployee,
    deleteEmployee,
    updateEmployeeIncapacidad,
  } = useSupabaseData();

  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyStarlite, setShowOnlyStarlite] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // Departamento activo (master-detail en PC).
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  // Departamentos expandidos (accordion en móvil).
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  // Agrupa por departamento (área); cada grupo ordenado por número de
  // empleado; departamentos ordenados alfabéticamente.
  const groups = useMemo<DepartmentGroup[]>(() => {
    const term = searchTerm.trim().toUpperCase();
    const byArea = new Map<string, Employee[]>();

    for (const emp of employees) {
      if (showOnlyStarlite && !emp.is_starlite) {
        continue;
      }
      if (
        term &&
        !emp.nombre.toUpperCase().includes(term) &&
        !emp.num_empleado.toUpperCase().includes(term) &&
        !emp.puesto.toUpperCase().includes(term) &&
        !emp.area.toUpperCase().includes(term) &&
        !emp.seccion.toUpperCase().includes(term)
      ) {
        continue;
      }
      const area = emp.area || 'Sin departamento';
      const list = byArea.get(area) ?? [];
      list.push(emp);
      byArea.set(area, list);
    }

    return Array.from(byArea.entries())
      .map(([area, list]) => ({
        area,
        empleados: [...list].sort((a, b) =>
          compareNumEmpleado(a.num_empleado, b.num_empleado)
        ),
      }))
      .sort((a, b) => a.area.localeCompare(b.area, 'es'));
  }, [employees, searchTerm, showOnlyStarlite]);

  // Mantiene un departamento válido seleccionado en PC. Cuando hay búsqueda,
  // salta al primer grupo con coincidencias.
  useEffect(() => {
    if (groups.length === 0) {
      setSelectedArea(null);
      return;
    }
    const term = searchTerm.trim();
    if (term) {
      setSelectedArea(groups[0].area);
      return;
    }
    setSelectedArea((prev) =>
      prev && groups.some((g) => g.area === prev) ? prev : groups[0].area
    );
  }, [groups, searchTerm]);

  // En móvil, una búsqueda activa expande automáticamente los resultados.
  useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedAreas(new Set(groups.map((g) => g.area)));
    }
  }, [searchTerm, groups]);

  const handlers: EmployeeActionHandlers = {
    onEdit: setEditTarget,
    onDelete: setDeleteTarget,
    onIncapacidad: setIncapacidadTarget,
  };

  async function handleUpdateEmployee(
    num_empleado: string,
    fields: Partial<
      Pick<
        Employee,
        | 'nombre'
        | 'area'
        | 'seccion'
        | 'puesto'
        | 'categoria'
        | 'turno'
        | 'fecha_ingreso'
        | 'ruta'
        | 'parada'
      >
    >
  ) {
    return notifyResult(updateEmployee(num_empleado, fields), {
      success: 'Empleado actualizado',
      error: 'No se pudo actualizar el empleado',
    });
  }

  async function handleDeleteEmployee(num_empleado: string) {
    return notifyResult(deleteEmployee(num_empleado), {
      success: 'Empleado eliminado',
      error: 'No se pudo eliminar el empleado',
    });
  }

  function toggleArea(area: string) {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  const activeGroup = useMemo(
    () => groups.find((g) => g.area === selectedArea) ?? null,
    [groups, selectedArea]
  );

  if (loading && employees.length === 0) {
    return (
      <section className="empleados config-page__content" id="page-empleados">
        <section className="empleados__hero">
          <div>
            <h1 className="empleados__title">Empleados</h1>
          </div>
          <Skeleton width="100%" height={40} radius="var(--rounded-md)" />
        </section>
        {isDesktop ? (
          <div className="empleados__layout">
            <nav className="empleados__rail" aria-hidden="true">
              <div className="empleados__rail-list">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    height={34}
                    radius="var(--rounded-md)"
                    style={{ margin: '2px 0' }}
                  />
                ))}
              </div>
            </nav>
            <section className="empleados__detail">
              <SkeletonTable rows={8} columns={['18%', '40%', '30%', '10%']} />
            </section>
          </div>
        ) : (
          <SkeletonCardList items={6} />
        )}
      </section>
    );
  }

  return (
    <section className="empleados config-page__content" id="page-empleados">
      <section className="empleados__hero">
        <div>
          <h1 className="empleados__title">Empleados</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="empleados__search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, número, puesto o área…"
              aria-label="Buscar empleados"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', flexShrink: 0 }}>
            <input 
              type="checkbox" 
              checked={showOnlyStarlite}
              onChange={(e) => setShowOnlyStarlite(e.target.checked)}
            />
            <span className="type-body-sm color-ink">Solo Starlite</span>
          </label>
        </div>
      </section>

      {!isConfigured && employees.length > 0 && (
        <div className="empleados__banner" role="status">
          <CloudOff size={16} aria-hidden="true" />
          <span>
            Almacenamiento no configurado. Los datos viven solo en este
            navegador.
          </span>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empleados__empty">
          <Users size={28} aria-hidden="true" />
          <p>
            {employees.length === 0
              ? 'No hay empleados registrados.'
              : 'Ningún empleado coincide con la búsqueda.'}
          </p>
        </div>
      ) : isDesktop ? (
        /* ── PC: master-detail ── */
        <div className="empleados__layout">
          <nav className="empleados__rail" aria-label="Departamentos">
            <ul className="empleados__rail-list" role="list">
              {groups.map((group) => (
                <li key={group.area}>
                  <button
                    type="button"
                    className={`empleados__rail-item${
                      group.area === selectedArea
                        ? ' empleados__rail-item--active'
                        : ''
                    }`}
                    onClick={() => setSelectedArea(group.area)}
                    aria-current={group.area === selectedArea}
                  >
                    <span className="empleados__rail-name">{group.area}</span>
                    <span className="empleados__rail-count">
                      {group.empleados.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <section className="empleados__detail" aria-live="polite">
            {activeGroup && (
              <>
                <header className="empleados__detail-head">
                  <h2 className="empleados__detail-name">{activeGroup.area}</h2>
                  <span className="empleados__detail-count">
                    {activeGroup.empleados.length}{' '}
                    {activeGroup.empleados.length === 1
                      ? 'empleado'
                      : 'empleados'}
                  </span>
                </header>
                <div className="empleados__detail-body">
                  <EmployeeCards
                    empleados={activeGroup.empleados}
                    handlers={handlers}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      ) : (
        /* ── Móvil: accordion ── */
        <div className="empleados__accordion">
          {groups.map((group) => {
            const expanded = expandedAreas.has(group.area);
            const panelId = `empleados-panel-${group.area}`;
            return (
              <section key={group.area} className="empleados__acc-item">
                <h2 className="empleados__acc-heading">
                  <button
                    type="button"
                    className="empleados__acc-trigger"
                    onClick={() => toggleArea(group.area)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                  >
                    <span className="empleados__acc-name">{group.area}</span>
                    <span className="empleados__acc-count">
                      {group.empleados.length}
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`empleados__acc-chevron${
                        expanded ? ' empleados__acc-chevron--open' : ''
                      }`}
                    />
                  </button>
                </h2>
                {expanded && (
                  <div id={panelId} className="empleados__acc-panel">
                    <EmployeeCards
                      empleados={group.empleados}
                      handlers={handlers}
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <EditEmployeeModal
        isOpen={editTarget !== null}
        employee={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateEmployee}
      />

      <IncapacidadModal
        isOpen={incapacidadTarget !== null}
        employee={incapacidadTarget}
        onClose={() => setIncapacidadTarget(null)}
        onSave={(num, enIncapacidad, hasta) =>
          notifyResult(updateEmployeeIncapacidad(num, enIncapacidad, hasta), {
            success: enIncapacidad ? 'Incapacidad registrada' : 'Incapacidad finalizada',
            error: 'No se pudo actualizar la incapacidad',
          })
        }
      />

      <DeleteEmployeeConfirmModal
        isOpen={deleteTarget !== null}
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEmployee}
      />
    </section>
  );
}
