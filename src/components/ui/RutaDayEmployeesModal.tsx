import { useMemo } from 'react';
import { CalendarDays, UsersRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  getEmpleadosPorDia,
  type EmpleadoRuta,
  type RutaAgrupada,
} from '@/hooks/useRutas';
import './RutaDayEmployeesModal.css';

interface RutaDayEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruta: RutaAgrupada | null;
  dia: string | null;
}

function EmployeeRows({ employees }: { employees: EmpleadoRuta[] }) {
  return (
    <>
      {employees.map((emp) => (
        <tr key={emp.numeroEmpleado}>
          <td className="ruta-day-modal__num">{emp.numeroEmpleado}</td>
          <td className="ruta-day-modal__name">{emp.nombre}</td>
          <td className="ruta-day-modal__seccion">
            {emp.seccion ?? (
              <span className="ruta-day-modal__muted">Sin sección</span>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

function compareBySeccion(a: EmpleadoRuta, b: EmpleadoRuta): number {
  const secA = a.seccion?.trim();
  const secB = b.seccion?.trim();
  if (!secA && !secB) return a.nombre.localeCompare(b.nombre);
  if (!secA) return 1;
  if (!secB) return -1;
  return secA.localeCompare(secB) || a.nombre.localeCompare(b.nombre);
}

export function RutaDayEmployeesModal({
  isOpen,
  onClose,
  ruta,
  dia,
}: RutaDayEmployeesModalProps) {
  const employees = useMemo(() => {
    if (!ruta || !dia) return [];
    return [...getEmpleadosPorDia(ruta.empleados, dia)].sort(compareBySeccion);
  }, [ruta, dia]);

  if (!ruta || !dia) return null;

  const routeCode = ruta.nombreRuta.split('-')[0].trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<CalendarDays size={20} aria-hidden="true" />}
      title={dia}
      subtitle={`${routeCode} · ${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
      className="ruta-day-modal"
      size="lg"
      fullscreenMobile={false}
    >
      <div className="modal-body ruta-day-modal__body">
        {employees.length === 0 ? (
          <div className="ruta-day-modal__empty">
            <UsersRound size={32} aria-hidden="true" />
            <p className="type-body-sm">
              No hay empleados asignados a esta ruta el día {dia.toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="ruta-day-modal__table-wrap">
            <table
              className="ruta-day-modal__table"
              aria-label={`Empleados de la ruta ${routeCode} el ${dia.toLowerCase()}`}
            >
              <thead>
                <tr>
                  <th scope="col">Número</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Sección</th>
                </tr>
              </thead>
              <tbody>
                <EmployeeRows employees={employees} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
