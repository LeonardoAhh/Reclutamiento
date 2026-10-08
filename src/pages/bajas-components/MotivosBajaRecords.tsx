import { useEffect, useMemo } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { indicatorBajaType, toBajaSentenceCase } from '@/lib/bajaReasonCatalog';
import type { BajaReasonUpdate } from '@/lib/bajaReasonUpdates';
import {
  getMotivosBajaCopy,
  translateBajaCatalogLabel,
} from './motivosBajaTranslations';

interface MotivosBajaRecordsProps {
  bajas: BajaReasonUpdate[];
  year: string;
  month: string;
  exitType: string;
}

const employeeNumberCollator = new Intl.Collator('es-MX', { numeric: true });

export function MotivosBajaRecords({ bajas, year, month, exitType }: MotivosBajaRecordsProps) {
  const { language } = useLanguage();
  const copy = getMotivosBajaCopy(language);
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
            <th scope="col" className="motivos-baja__records-employee" aria-label={copy.employeeColumn} aria-sort="descending">{copy.employeeNumber}</th>
            <th scope="col" className="motivos-baja__records-type">{copy.typeColumn}</th>
            <th scope="col" className="motivos-baja__records-reason">{copy.reasonColumn}</th>
            <th scope="col" className="motivos-baja__records-detail">{copy.detailColumn}</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((baja) => (
            <tr key={baja.num_empleado}>
              <td data-label={copy.employeeColumn}>{baja.num_empleado}</td>
              <td data-label={copy.typeColumn}>
                {translateBajaCatalogLabel(toBajaSentenceCase(indicatorBajaType(baja.tipo_baja)), language)}
              </td>
              <td data-label={copy.reasonColumn}>
                {baja.motivo_baja_estandarizado?.trim()
                  ? translateBajaCatalogLabel(toBajaSentenceCase(baja.motivo_baja_estandarizado), language)
                  : copy.unclassified}
              </td>
              <td data-label={copy.detailColumn}>
                {baja.motivo_baja?.trim()
                  ? toBajaSentenceCase(baja.motivo_baja)
                  : copy.noDetail}
              </td>
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
            ariaLabel={copy.pagination}
            sticky
          />
        </div>
      )}
    </>
  );
}
