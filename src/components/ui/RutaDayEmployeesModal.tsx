import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getEmpleadosPorDia, ROUTE_DAYS, useRutas, type EmpleadoRuta } from '@/hooks/useRutas';
import './RutaDayEmployeesModal.css';

function compareBySeccion(a: EmpleadoRuta, b: EmpleadoRuta): number {
  const secA = a.seccion?.trim();
  const secB = b.seccion?.trim();
  if (!secA && !secB) return a.nombre.localeCompare(b.nombre);
  if (!secA) return 1;
  if (!secB) return -1;
  return secA.localeCompare(secB) || a.nombre.localeCompare(b.nombre);
}

export function RutaDayEmployeesPage() {
  const [params] = useSearchParams();
  const routeName = params.get('ruta');
  const day = params.get('dia');
  const searchTerm = params.get('buscar');
  const headingRef = useRef<HTMLAnchorElement>(null);
  const { rutas, loading, errorMsg } = useRutas();
  const route = rutas.find(item => item.nombreRuta === routeName);
  const validDay = ROUTE_DAYS.find(item => item === day);
  const employees = useMemo(() => {
    if (!route || !validDay) return [];
    return [...getEmpleadosPorDia(route.empleados, validDay)].sort(compareBySeccion);
  }, [route, validDay]);
  const backHref = routeName ? `/rutas?${new URLSearchParams({ ruta: routeName, ...(searchTerm ? { buscar: searchTerm } : {}) })}` : '/rutas';
  const title = validDay ? `Empleados del ${validDay.toLowerCase()}` : 'Empleados por día';

  useEffect(() => {
    headingRef.current?.focus();
  }, [routeName, day]);

  return (
    <main className="ruta-day-page container" aria-labelledby="ruta-day-page-title">
      <header className="ruta-day-page__header">
        <h1 id="ruta-day-page-title" className="app-page-title ruta-day-page__heading">
          <Link ref={headingRef} className="ruta-day-page__title-link" to={backHref} aria-label={`Volver a Rutas desde ${title}`}>
            <ArrowLeft aria-hidden="true" />
            <span>{title}</span>
          </Link>
        </h1>
        {route && <p className="type-body-md">{route.nombreRuta}</p>}
      </header>

      {loading ? (
        <p role="status">Cargando empleados de la ruta…</p>
      ) : errorMsg ? (
        <div role="alert" className="ruta-day-page__notice">
          <p>No se pudieron cargar los empleados de esta ruta.</p>
          <p>{errorMsg}</p>
        </div>
      ) : !route || !validDay ? (
        <div className="ruta-day-page__notice">
          <p>La ruta o el día ya no están disponibles.</p>
          <Link className="btn-text" to="/rutas">Ver rutas disponibles</Link>
        </div>
      ) : employees.length === 0 ? (
        <p className="ruta-day-page__notice">No hay empleados asignados a esta ruta el {validDay.toLowerCase()}.</p>
      ) : (
        <section aria-label={`Empleados de ${route.nombreRuta} el ${validDay.toLowerCase()}`}>
          <table className="ruta-day-page__table">
            <thead>
              <tr>
                <th scope="col">Número</th>
                <th scope="col">Nombre</th>
                <th scope="col">Sección</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.numeroEmpleado}>
                  <td className="ruta-day-page__number">
                    <span className="ruta-day-page__mobile-label" aria-hidden="true">Número </span>{emp.numeroEmpleado}
                  </td>
                  <th scope="row" className="ruta-day-page__name">{emp.nombre}</th>
                  <td className="ruta-day-page__section">
                    <span className="ruta-day-page__mobile-label" aria-hidden="true">Sección </span>{emp.seccion || 'Sin sección'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
