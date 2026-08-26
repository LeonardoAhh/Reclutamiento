import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  ariaLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  ariaLabel = "Paginación",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const maxVisiblePages = 5;
  const pages = useMemo(() => {
    const result: (number | "ellipsis")[] = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    if (start > 1) {
      result.push(1);
      if (start > 2) result.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) result.push("ellipsis");
      result.push(totalPages);
    }

    return result;
  }, [currentPage, totalPages]);

  return (
    <nav
      className="pagination"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <button
        type="button"
        className="pagination__btn pagination__btn--prev pagination__mobile-only"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Página anterior"
        aria-disabled={!canGoPrev}
      >
        <ChevronLeft size={18} aria-hidden="true" />
        <span className="pagination__btn-text">Anterior</span>
      </button>

      <div className="pagination__pages" role="group" aria-label="Páginas">
        {pages.map((page, idx) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="pagination__ellipsis"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`pagination__btn pagination__page-btn ${
                page === currentPage ? "pagination__btn--active" : ""
              }`}
              onClick={() => onPageChange(page)}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="pagination__btn pagination__btn--next pagination__mobile-only"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Página siguiente"
        aria-disabled={!canGoNext}
      >
        <span className="pagination__btn-text">Siguiente</span>
        <ChevronRight size={18} aria-hidden="true" />
      </button>

      <div className="pagination__mobile-info pagination__mobile-only" aria-hidden="true">
        Página {currentPage} de {totalPages}
      </div>

      <div className="pagination__desktop-controls">
        <button
          type="button"
          className="pagination__btn pagination__btn--prev"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Página anterior"
          aria-disabled={!canGoPrev}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pagination__btn pagination__btn--next"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Página siguiente"
          aria-disabled={!canGoNext}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
