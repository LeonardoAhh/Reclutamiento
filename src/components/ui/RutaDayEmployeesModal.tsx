import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { getEmpleadosPorDia, useRutas, type EmpleadoRuta } from '@/hooks/useRutas';
import { useLanguage } from '@/contexts/LanguageContext';
import { findRouteDay, formatRouteDay, getConfiguracionCopy, getRouteDayEmployeesTitle } from '@/pages/configuracion-views/configuracion-translations';
import { RouteDayCapacitySummary } from '@/pages/configuracion-views/RouteDayCapacitySummary';
import { RouteDayEmployeesTable } from '@/pages/configuracion-views/RouteDayEmployeesTable';
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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  const [params] = useSearchParams();
  const routeName = params.get('route');
  const day = params.get('day');
  const searchTerm = params.get('search');
  const headingRef = useRef<HTMLAnchorElement>(null);
  const { rutas, loading, errorMsg } = useRutas();
  const route = rutas.find((item) => item.nombreRuta === routeName);
  const validDay = findRouteDay(day);
  const employees = useMemo(() => {
    if (!route || !validDay) return [];
    return [...getEmpleadosPorDia(route.empleados, validDay)].sort(compareBySeccion);
  }, [route, validDay]);
  const backHref = routeName
    ? `/routes?${new URLSearchParams({ route: routeName, ...(searchTerm ? { search: searchTerm } : {}) })}`
    : '/routes';
  const displayDay = validDay ? formatRouteDay(validDay, language).toLowerCase() : '';
  const title = getRouteDayEmployeesTitle(day, language);
  const compactRouteName = route?.nombreRuta.match(/^\s*(R\d+)\s*-/i)?.[1] ?? route?.nombreRuta;

  useEffect(() => {
    headingRef.current?.focus();
  }, [routeName, day]);

  return (
    <main className="ruta-day-page container" aria-labelledby="ruta-day-page-title">
      <header className="ruta-day-page__header">
        <h1 id="ruta-day-page-title" className="app-page-title ruta-day-page__heading">
          <Link
            ref={headingRef}
            className="ruta-day-page__title-link"
            to={backHref}
            aria-label={`${language === 'en' ? 'Back to Routes from' : 'Volver a Rutas desde'} ${title}`}
          >
            <ArrowLeft aria-hidden="true" />
            <span>{title}</span>
          </Link>
        </h1>
        {route && (
          <p className="type-body-md ruta-day-page__route-name" aria-label={route.nombreRuta}>
            <span className="ruta-day-page__route-name-compact" aria-hidden="true">
              {compactRouteName}
            </span>
            <span className="ruta-day-page__route-name-full" aria-hidden="true">
              {route.nombreRuta}
            </span>
          </p>
        )}
      </header>

      {loading ? (
        <LoadingSkeleton label={copy.loadingRouteEmployees} className="ruta-day-page__skeleton">
          <div className="ruta-day-page__skeleton-rows" aria-hidden="true">
            {['first', 'second', 'third', 'fourth', 'fifth'].map((row) => (
              <div className="ruta-day-page__skeleton-row" key={row}>
                <span className="loading-skeleton__bone ruta-day-page__skeleton-cell ruta-day-page__skeleton-cell--number" />
                <span className="loading-skeleton__bone ruta-day-page__skeleton-cell ruta-day-page__skeleton-cell--name" />
                <span className="loading-skeleton__bone ruta-day-page__skeleton-cell ruta-day-page__skeleton-cell--section" />
              </div>
            ))}
          </div>
        </LoadingSkeleton>
      ) : errorMsg ? (
        <div role="alert" className="ruta-day-page__notice">
          <p>
            {language === 'en'
              ? 'Could not load route details. Check your connection and try again.'
              : copy.routeEmployeesLoadError}
          </p>
          {language === 'es' && <p>{errorMsg}</p>}
        </div>
      ) : !route || !validDay ? (
        <div className="ruta-day-page__notice">
          <p>{copy.routeOrDayUnavailable}</p>
          <Link className="btn-text" to="/routes">
            {copy.viewAvailableRoutes}
          </Link>
        </div>
      ) : employees.length === 0 ? (
        <p className="ruta-day-page__notice">
          {copy.noEmployeesAssigned} {displayDay}.
        </p>
      ) : (
        <>
          <RouteDayCapacitySummary
            employees={employees}
            day={validDay}
            dayLabel={displayDay}
            routeName={route.nombreRuta}
            capacities={route.maxCapacityPerShift}
          />
          <RouteDayEmployeesTable
            key={`${route.nombreRuta}::${validDay}`}
            employees={employees}
            routeName={route.nombreRuta}
            displayDay={displayDay}
          />
        </>
      )}
    </main>
  );
}
