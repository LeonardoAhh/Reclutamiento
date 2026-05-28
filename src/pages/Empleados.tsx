import { useMemo, useState } from 'react';
import { Users, Search, HeartPulse, CloudOff } from 'lucide-react';
import { EditEmployeeSheet } from '@/components/ui/EditEmployeeSheet';
import { IncapacidadModal } from '@/components/ui/IncapacidadModal';
import { DeleteEmployeeConfirmModal } from '@/components/ui/DeleteEmployeeConfirmModal';
import { EmployeeRowActions } from '@/components/ui/EmployeeRowActions';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatShortDate } from '@/lib/dates';
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

export function Empleados() {
  const {
    employees,
    loading,
    isConfigured,
    updateEmployee,
    deleteEmployee,
    updateEmployeeIncapacidad,
  } = useSupabaseData();

  const [searchTerm, setSearchTerm] = useState('');
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // Agrupa por departamento (área); cada grupo ordenado por número de
  // empleado; departamentos ordenados alfabéticamente.
  const groups = useMemo<DepartmentGroup[]>(() => {
    const term = searchTerm.trim().toUpperCase();
    const byArea = new Map<string, Employee[]>();

    for (const emp of employees) {
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
  }, [employees, searchTerm]);

  const totalShown = useMemo(
    () => groups.reduce((sum, g) => sum + g.empleados.length, 0),
    [groups]
  );

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
    return updateEmployee(num_empleado, fields);
  }

  async function handleDeleteEmployee(num_empleado: string) {
    return deleteEmployee(num_empleado);
  }

  if (loading) {
    return (
      <main className="empleados container" id="page-empleados">
        <section className="empleados__hero">
          <div>
            <h1 className="empleados__title">Empleados</h1>
            <p className="empleados__sub">Cargando empleados…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="empleados container" id="page-empleados">
      <section className="empleados__hero">
        <div>
          <h1 className="empleados__title">Empleados</h1>
          <p className="empleados__sub">
            {totalShown} {totalShown === 1 ? 'empleado' : 'empleados'} ·{' '}
            {groups.length}{' '}
            {groups.length === 1 ? 'departamento' : 'departamentos'}
          </p>
        </div>
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
      ) : (
        <div className="empleados__grid">
          {groups.map((group) => (
            <section
              key={group.area}
              className="empleados__dept"
              aria-label={`Departamento ${group.area}`}
            >
              <header className="empleados__dept-head">
                <h2 className="empleados__dept-name">{group.area}</h2>
                <span className="empleados__dept-count">
                  {group.empleados.length}
                </span>
              </header>

              <div className="empleados__table-wrapper">
                <table className="empleados__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Puesto</th>
                      <th scope="col" className="empleados__col-actions">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.empleados.map((emp) => (
                      <tr
                        key={emp.id ?? emp.num_empleado}
                        className={
                          emp.en_incapacidad ? 'empleados__row--incapacidad' : ''
                        }
                      >
                        <td className="empleados__cell-num">
                          {emp.num_empleado}
                        </td>
                        <td>
                          <span className="empleados__name">{emp.nombre}</span>
                          {emp.en_incapacidad && (
                            <span
                              className="empleados__incapacidad-tag"
                              title={
                                emp.incapacidad_hasta
                                  ? `Incapacidad hasta ${formatShortDate(
                                      emp.incapacidad_hasta
                                    )}`
                                  : 'En incapacidad médica'
                              }
                            >
                              <HeartPulse size={11} aria-hidden="true" />
                              Incapacidad
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="empleados__puesto">{emp.puesto}</span>
                          {emp.seccion && (
                            <span className="empleados__seccion">
                              {emp.seccion}
                            </span>
                          )}
                        </td>
                        <td className="empleados__col-actions">
                          <EmployeeRowActions
                            employee={emp}
                            onEdit={setEditTarget}
                            onDelete={setDeleteTarget}
                            onIncapacidad={setIncapacidadTarget}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <EditEmployeeSheet
        isOpen={editTarget !== null}
        employee={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateEmployee}
      />

      <IncapacidadModal
        isOpen={incapacidadTarget !== null}
        employee={incapacidadTarget}
        onClose={() => setIncapacidadTarget(null)}
        onSave={updateEmployeeIncapacidad}
      />

      <DeleteEmployeeConfirmModal
        isOpen={deleteTarget !== null}
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEmployee}
      />
    </main>
  );
}
