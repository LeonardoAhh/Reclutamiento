import { ArrowLeft, ArrowRight } from "lucide-react";
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

  return (
    <nav className="pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="step-nav-control"
        onClick={handlePrev}
        disabled={!canGoPrev}
        aria-label="Página anterior"
      >
        <ArrowLeft aria-hidden="true" />
      </button>

      <span className="pagination__text" aria-live="polite" aria-atomic="true">
        Página {currentPage} de {safeTotalPages}
      </span>

      <button
        type="button"
        className="step-nav-control"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Página siguiente"
      >
        <ArrowRight aria-hidden="true" />
      </button>
    </nav>
  );
}
