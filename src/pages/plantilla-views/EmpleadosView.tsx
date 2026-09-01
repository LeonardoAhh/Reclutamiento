import { useEffect, useMemo, useState } from 'react';
import { CloudOff, UsersRound } from 'lucide-react';

import { EditEmployeeModal } from '@/components/ui/EditEmployeeModal';
import { StarliteBadge } from '@/components/ui/Badge';
import { IncapacidadModal } from '@/components/ui/IncapacidadModal';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { SearchField } from '@/components/ui/SearchField';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { notifyResult } from '@/lib/notify';
import type { Employee } from '@/lib/types';
import {
  DesktopEmployeeDirectory,
  MobileEmployeeDirectory,
} from './EmployeeDirectoryGroups';
import { groupEmployees, type DepartmentGroup } from './employeeDirectory';
import './Empleados.css';

export function EmpleadosView() {
  const {
    employees,
    loading,
    isConfigured,
    updateEmployee,
    updateEmployeeIncapacidad,
  } = useSupabaseData();

  const isDesktop = useMediaQuery('(min-width: 1080px)');

  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyStarlite, setShowOnlyStarlite] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [incapacidadTarget, setIncapacidadTarget] = useState<Employee | null>(null);

  // Departamento activo (master-detail en PC).
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  // Departamentos expandidos (accordion en móvil).
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  // Agrupa por departamento (área); cada grupo ordenado por número de
  // empleado; departamentos ordenados alfabéticamente.
  const groups = useMemo<DepartmentGroup[]>(
    () => groupEmployees(employees, searchTerm, showOnlyStarlite),
    [employees, searchTerm, showOnlyStarlite]
  );

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
  const visibleEmployeeCount = groups.reduce(
    (total, group) => total + group.empleados.length,
    0
  );

  function clearFilters() {
    setSearchTerm('');
    setShowOnlyStarlite(false);
  }

  return (
    <BoneyardSkeleton
      name="plantilla-empleados"
      loading={loading && employees.length === 0}
      loadingLabel="Cargando empleados…"
    >
      <section className="empleados" id="page-empleados">
        <header className="empleados__hero">
          <p className="empleados__summary">
            {visibleEmployeeCount}{' '}
            {visibleEmployeeCount === 1 ? 'empleado' : 'empleados'} ·{' '}
            {groups.length}{' '}
            {groups.length === 1 ? 'departamento' : 'departamentos'}
          </p>
          <div
            className="empleados__filters"
            role="search"
            aria-label="Filtrar empleados"
          >
            <SearchField
              id="empleados-search"
              className="empleados__search"
              label="Buscar empleados"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Buscar por nombre, número, puesto o área…"
              autoComplete="off"
            />
            <label className="toggle-switch empleados__starlite-filter">
              <input
                type="checkbox"
                role="switch"
                checked={showOnlyStarlite}
                onChange={(event) => setShowOnlyStarlite(event.target.checked)}
                aria-label="Solo proyecto Starlite"
              />
              <span className="toggle-switch__slider" aria-hidden="true" />
              <StarliteBadge />
            </label>
          </div>
        </header>

        {!isConfigured && employees.length > 0 && (
          <div className="empleados__banner" role="status">
            <CloudOff size="var(--icon-size-sm)" aria-hidden="true" />
            <span>
              Almacenamiento no configurado. Los datos viven solo en este
              navegador.
            </span>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="empleados__empty">
            <UsersRound size="var(--icon-size-xl)" aria-hidden="true" />
            <p>
              {employees.length === 0
                ? 'No hay empleados registrados.'
                : 'Ningún empleado coincide con la búsqueda.'}
            </p>
            {(searchTerm || showOnlyStarlite) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : isDesktop ? (
          <DesktopEmployeeDirectory
            groups={groups}
            activeGroup={activeGroup}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            onEdit={setEditTarget}
            onIncapacidad={setIncapacidadTarget}
          />
        ) : (
          <MobileEmployeeDirectory
            groups={groups}
            expandedAreas={expandedAreas}
            onToggleArea={toggleArea}
            onEdit={setEditTarget}
            onIncapacidad={setIncapacidadTarget}
          />
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
              success: enIncapacidad
                ? 'Incapacidad registrada'
                : 'Incapacidad finalizada',
              error: 'No se pudo actualizar la incapacidad',
            })
          }
        />
      </section>
    </BoneyardSkeleton>
  );
}
