import { useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import type { PuestoBreakdownRow } from '@/lib/bajas';
import './BajasPorPuesto.css';

interface BajasPorPuestoProps {
  byPuesto: PuestoBreakdownRow[];
  filterKey?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 5;

export function BajasPorPuesto({
  byPuesto,
  filterKey,
  pageSize = DEFAULT_PAGE_SIZE,
}: BajasPorPuestoProps) {
  const {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = usePagination(byPuesto, pageSize);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    goToPage(1);
  }, [filterKey, goToPage]);

  return (
    <section className="bajas-por-puesto" aria-label="Bajas por puesto">
      <header className="bajas-por-puesto__head">
        <h2 className="bajas-por-puesto__title">Por puesto</h2>
        <span className="bajas-por-puesto__meta">
          {byPuesto.length} puesto{byPuesto.length === 1 ? '' : 's'} con movimiento
        </span>
      </header>

      {byPuesto.length === 0 ? (
        <div className="bajas-por-puesto__empty">
          <p>Sin movimiento para los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="bajas-por-puesto__table-container">
            <table className="bajas-por-puesto__table">
              <thead>
                <tr>
                  <th scope="col" className="bajas-por-puesto__th bajas-por-puesto__th--main">
                    Puesto / Área
                  </th>
                  <th scope="col" className="bajas-por-puesto__th bajas-por-puesto__th--num">
                    Bajas
                  </th>
                  <th scope="col" className="bajas-por-puesto__th bajas-por-puesto__th--num">
                    Ingresos
                  </th>
                  <th scope="col" className="bajas-por-puesto__th bajas-por-puesto__th--num">
                    Cubiertas
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => {
                  const pct =
                    row.bajas > 0 ? Math.round((row.cubiertas10d / row.bajas) * 100) : 0;
                  return (
                    <tr key={`${row.area}-${row.puesto}`} className="bajas-por-puesto__tr">
                      <td className="bajas-por-puesto__td bajas-por-puesto__td--main">
                        <div className="bajas-por-puesto__identity">
                          <span className="bajas-por-puesto__puesto">{row.puesto}</span>
                          <span className="bajas-por-puesto__area">{row.area}</span>
                        </div>
                      </td>
                      <td className="bajas-por-puesto__td bajas-por-puesto__td--num">
                        <span className="bajas-por-puesto__val">{row.bajas}</span>
                      </td>
                      <td className="bajas-por-puesto__td bajas-por-puesto__td--num">
                        <span className="bajas-por-puesto__val">{row.ingresos}</span>
                      </td>
                      <td className="bajas-por-puesto__td bajas-por-puesto__td--num">
                        {row.bajas > 0 ? (
                          <span
                            className={`bajas-por-puesto__val ${
                              pct === 100 ? 'bajas-por-puesto__val--success' : ''
                            }`}
                          >
                            {row.cubiertas10d}{' '}
                            <span className="bajas-por-puesto__pct">({pct}%)</span>
                          </span>
                        ) : (
                          <span className="bajas-por-puesto__muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bajas-por-puesto__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPrev={prevPage}
              onNext={nextPage}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              ariaLabel="Paginación de puestos"
            />
          </div>
        </>
      )}
    </section>
  );
}
