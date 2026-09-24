import { useState, useEffect, useMemo } from 'react';
import { HeartPulse } from 'lucide-react';

import { ProximoIngresoBadge, StarliteBadge } from '@/components/ui/Badge';
import { EmployeeRowActions } from '@/components/ui/EmployeeRowActions';
import { Pagination } from '@/components/ui/Pagination';
import { formatShortDate } from '@/lib/dates';
import type { Employee } from '@/lib/types';

interface EmployeeDirectoryListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onIncapacidad: (employee: Employee) => void;
}

export function EmployeeDirectoryList({
  employees,
  onEdit,
  onIncapacidad,
}: EmployeeDirectoryListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [employees]);

  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return employees.slice(start, start + itemsPerPage);
  }, [employees, currentPage, itemsPerPage]);

  return (
    <>
      <ul className="empleados__grid-list" role="list">
        {paginatedEmployees.map((employee) => (
          <li
            key={employee.id ?? employee.num_empleado}
            className="empleados__grid-item"
          >
            <div className="empleados__grid-info">
              <div className="empleados__grid-header">
                <span className="empleados__name">{employee.nombre}</span>
                {(employee.en_incapacidad || employee.is_starlite || String(employee.fecha_ingreso).localeCompare(new Date().toISOString().split('T')[0]) > 0) && (
                  <div className="empleados__statuses">
                    {employee.en_incapacidad && (
                      <span
                        className="empleados__incapacidad-tag"
                        title={
                          employee.incapacidad_hasta
                            ? `Incapacidad hasta ${formatShortDate(employee.incapacidad_hasta)}`
                            : 'En incapacidad médica'
                        }
                      >
                        <HeartPulse size="var(--icon-size-sm)" aria-hidden="true" />
                        Incapacidad
                      </span>
                    )}
                    {employee.is_starlite && <StarliteBadge />}
                    {String(employee.fecha_ingreso).localeCompare(new Date().toISOString().split('T')[0]) > 0 && (
                      <ProximoIngresoBadge iconOnly />
                    )}
                  </div>
                )}
              </div>
              <span className="empleados__metadata">
                {[`#${employee.num_empleado}`, employee.puesto, employee.seccion]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <EmployeeRowActions
              employee={employee}
              onEdit={onEdit}
              onIncapacidad={onIncapacidad}
            />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="empleados__pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            canGoPrev={currentPage > 1}
            canGoNext={currentPage < totalPages}
            onPrev={() => setCurrentPage((p) => p - 1)}
            onNext={() => setCurrentPage((p) => p + 1)}
            variant="compact"
          />
        </div>
      )}
    </>
  );
}
