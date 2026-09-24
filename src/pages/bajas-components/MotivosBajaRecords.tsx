import { useEffect, useMemo } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { indicatorBajaType, toBajaSentenceCase } from '@/lib/bajaReasonCatalog';
import type { BajaReasonUpdate } from '@/lib/bajaReasonUpdates';

interface MotivosBajaRecordsProps {
  bajas: BajaReasonUpdate[];
  year: string;
  month: string;
  exitType: string;
}

const employeeNumberCollator = new Intl.Collator('es-MX', { numeric: true });

export function MotivosBajaRecords({ bajas, year, month, exitType }: MotivosBajaRecordsProps) {
  const sortedBajas = useMemo(
    () => [...bajas].sort((a, b) => employeeNumberCollator.compare(b.num_empleado, a.num_empleado)),
    [bajas],
  );
  const {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = usePagination(sortedBajas, 10);

  useEffect(() => {
    goToPage(1);
  }, [year, month, exitType, goToPage]);

  return (
    <>
      <table className="motivos-baja__records">
        <thead>
          <tr>
            <th scope="col" className="motivos-baja__records-employee" aria-label="Número de empleado" aria-sort="descending">No. empleado</th>
            <th scope="col" className="motivos-baja__records-type">Tipo de baja</th>
            <th scope="col" className="motivos-baja__records-reason">Motivo de baja</th>
            <th scope="col" className="motivos-baja__records-detail">Detalle de la baja</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((baja) => (
            <tr key={baja.num_empleado}>
              <td data-label="Número de empleado">{baja.num_empleado}</td>
              <td data-label="Tipo de baja">{toBajaSentenceCase(indicatorBajaType(baja.tipo_baja))}</td>
              <td data-label="Motivo de baja">{toBajaSentenceCase(baja.motivo_baja_estandarizado?.trim() || 'Sin clasificar')}</td>
              <td data-label="Detalle de la baja">{toBajaSentenceCase(baja.motivo_baja?.trim() || 'Sin detalle registrado.')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="motivos-baja__pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onPrev={prevPage}
            onNext={nextPage}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            ariaLabel="Paginación de bajas por motivo"
          />
        </div>
      )}
    </>
  );
}
