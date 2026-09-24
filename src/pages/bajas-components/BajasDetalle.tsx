import { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { BajaCoberturaBadge } from '@/components/ui/BajaDetailSheet';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import type { BajaWithCobertura } from '@/lib/bajas';
import { formatShortDate } from '@/lib/dates';
import './BajasDetalle.css';

interface BajasDetalleProps {
  year: number;
  bajasConCobertura: BajaWithCobertura[];
  loading: boolean;
  totalBajasKnown: number;
  onSelectBaja: (baja: BajaWithCobertura) => void;
  filterKey?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 5;

export function BajasDetalle({
  year,
  bajasConCobertura,
  loading,
  totalBajasKnown,
  onSelectBaja,
  filterKey,
  pageSize = DEFAULT_PAGE_SIZE,
}: BajasDetalleProps) {
  const {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = usePagination(bajasConCobertura, pageSize);

  // Reset to page 1 whenever filters or year change
  useEffect(() => {
    goToPage(1);
  }, [filterKey, year, goToPage]);

  return (
    <section className="bajas-detalle" aria-label="Detalle de bajas">
      <header className="bajas-detalle__head">
        <h2 className="bajas-detalle__title">Detalle de bajas {year}</h2>
        <span className="bajas-detalle__meta">
          {bajasConCobertura.length} registro{bajasConCobertura.length === 1 ? '' : 's'}
        </span>
      </header>

      {bajasConCobertura.length === 0 ? (
        <div className="bajas-detalle__empty">
          <p>
            {loading
              ? 'Cargando bajas…'
              : totalBajasKnown === 0
                ? 'Importa un JSON de bajas para empezar.'
                : 'Sin bajas para los filtros aplicados.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bajas-detalle__subhead" aria-hidden="true">
            <span className="bajas-detalle__th bajas-detalle__th--main">Colaborador / Puesto</span>
            <span className="bajas-detalle__th bajas-detalle__th--meta">Fecha · Cobertura</span>
          </div>

          <ul className="bajas-detalle__list" role="list">
            {pageItems.map((b) => {
              const cardClass = [
                'bajas-detalle__card',
                b.soloInduccion ? 'bajas-detalle__card--solo' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li key={`${b.num_empleado}-${b.fecha_baja}`} className="bajas-detalle__item">
                  <button
                    type="button"
                    className={cardClass}
                    aria-label={`Ver detalle de baja de ${b.nombre}`}
                    onClick={() => onSelectBaja(b)}
                  >
                    <div className="bajas-detalle__card-body">
                      <div className="bajas-detalle__card-row bajas-detalle__card-row--top">
                        <span className="bajas-detalle__card-name">{b.nombre}</span>
                        <time className="bajas-detalle__card-date">
                          {formatShortDate(b.fecha_baja)}
                        </time>
                      </div>
                      <div className="bajas-detalle__card-row bajas-detalle__card-row--bottom">
                        <span className="bajas-detalle__card-meta">
                          #{b.num_empleado} · {b.puesto}
                        </span>
                        <div className="bajas-detalle__card-status">
                          <BajaCoberturaBadge baja={b} />
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="bajas-detalle__card-chevron"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="bajas-detalle__pagination-wrap">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPrev={prevPage}
              onNext={nextPage}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              ariaLabel="Paginación de detalle de bajas"
            />
          </div>
        </>
      )}
    </section>
  );
}
