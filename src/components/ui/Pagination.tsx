import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  ariaLabel?: string;
  variant?: "numbered" | "compact";
  hideOnSinglePage?: boolean;
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
  variant = "compact",
  hideOnSinglePage = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  if (hideOnSinglePage && safeTotalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (canGoPrev) {
      if (onPrev) onPrev();
      else if (onPageChange) onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      if (onNext) onNext();
      else if (onPageChange) onPageChange(currentPage + 1);
    }
  };

  // Established system default: <btn-icon> Página X de Y <btn-icon>
  if (variant === "compact") {
    return (
      <nav className="pagination pagination--compact" aria-label={ariaLabel}>
        <button
          type="button"
          className="btn-icon"
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <span className="pagination__text" aria-live="polite" aria-atomic="true">
          Página {currentPage} de {safeTotalPages}
        </span>

        <button
          type="button"
          className="btn-icon"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </nav>
    );
  }

  // Variant: "numbered"
  const maxVisiblePages = 5;
  const pages = useMemo(() => {
    const result: (number | "ellipsis")[] = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(safeTotalPages, start + maxVisiblePages - 1);

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

    if (end < safeTotalPages) {
      if (end < safeTotalPages - 1) result.push("ellipsis");
      result.push(safeTotalPages);
    }

    return result;
  }, [currentPage, safeTotalPages]);

  return (
    <nav className="pagination pagination--numbered" aria-label={ariaLabel}>
      <button
        type="button"
        className="btn-icon"
        onClick={handlePrev}
        disabled={!canGoPrev}
        aria-label="Página anterior"
        aria-disabled={!canGoPrev}
      >
        <ChevronLeft size={16} aria-hidden="true" />
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
              onClick={() => onPageChange?.(page)}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <span className="pagination__mobile-info" aria-live="polite" aria-atomic="true">
        Página {currentPage} de {safeTotalPages}
      </span>

      <button
        type="button"
        className="btn-icon"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Página siguiente"
        aria-disabled={!canGoNext}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
