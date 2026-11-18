import { Pagination } from '@/components/ui/Pagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagination } from '@/hooks/usePagination';
import type { EmpleadoRuta } from '@/lib/rutas-data';
import { getConfiguracionCopy } from './configuracion-translations';

const EMPLOYEES_PER_PAGE = 5;

interface RouteDayEmployeesTableProps {
  employees: EmpleadoRuta[];
  routeName: string;
  displayDay: string;
}

export function RouteDayEmployeesTable({ employees, routeName, displayDay }: RouteDayEmployeesTableProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  const pagination = usePagination(employees, EMPLOYEES_PER_PAGE);

  return (
    <section
      className="ruta-day-page__employees"
      aria-label={`${language === 'en' ? 'Employees on' : 'Empleados de'} ${routeName} ${language === 'en' ? 'on' : 'el'} ${displayDay}`}
    >
      <div className="ruta-day-page__table-wrapper">
        <table className="ruta-day-page__table data-table data-table--cards">
          <caption className="sr-only">{copy.employeesOfDay} {displayDay}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.number}</th>
              <th scope="col">{copy.employeeName}</th>
              <th scope="col">{copy.section}</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((emp) => (
              <tr key={emp.numeroEmpleado}>
                <td className="ruta-day-page__number">
                  <span className="ruta-day-page__mobile-label" aria-hidden="true">
                    {copy.number}{' '}
                  </span>
                  {emp.numeroEmpleado}
                </td>
                <th scope="row" className="ruta-day-page__name">{emp.nombre}</th>
                <td className="ruta-day-page__section">
                  <span className="ruta-day-page__mobile-label" aria-hidden="true">
                    {copy.section}{' '}
                  </span>
                  {emp.seccion || copy.noSection}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
          canGoPrev={pagination.canGoPrev}
          canGoNext={pagination.canGoNext}
        />
      )}
    </section>
  );
}
