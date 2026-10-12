import { useEffect, useId, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
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
  hideOnSinglePage?: boolean;
  sticky?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  ariaLabel,
  hideOnSinglePage = true,
  sticky = false,
}: PaginationProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const inputId = useId();
  const totalId = useId();
  const safeTotalPages = Number.isSafeInteger(totalPages) ? Math.max(1, totalPages) : 1;
  const safeCurrentPage = Number.isSafeInteger(currentPage)
    ? Math.min(safeTotalPages, Math.max(1, currentPage))
    : 1;
  const [draftPage, setDraftPage] = useState(String(safeCurrentPage));

  useEffect(() => {
    setDraftPage(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const commitPage = () => {
    const parsed = Number(draftPage);
    const target = draftPage !== '' && Number.isSafeInteger(parsed)
      ? Math.min(safeTotalPages, Math.max(1, parsed))
      : safeCurrentPage;
    setDraftPage(String(target));
    if (target !== safeCurrentPage) onPageChange(target);
  };

  if (hideOnSinglePage && safeTotalPages <= 1) return null;

  const prevEnabled = canGoPrev && safeCurrentPage > 1;
  const nextEnabled = canGoNext && safeCurrentPage < safeTotalPages;

  return (
    <nav
      className={sticky ? 'pagination pagination--sticky' : 'pagination'}
      aria-label={ariaLabel ?? (en ? 'Pagination' : 'Paginaci\u00f3n')}
    >
      <button
        type="button"
        className="step-nav-control"
        onClick={() => {
          if (!prevEnabled) return;
          if (onPrev) onPrev();
          else onPageChange(safeCurrentPage - 1);
        }}
        disabled={!prevEnabled}
        aria-label={en ? 'Previous page' : 'P\u00e1gina anterior'}
      >
        <ArrowLeft aria-hidden="true" />
      </button>

      <span className="pagination__text">
        <label htmlFor={inputId}>{en ? 'Page' : 'P\u00e1gina'}</label>
        <input
          id={inputId}
          className="pagination__input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={draftPage}
          size={Math.max(1, String(safeTotalPages).length)}
          aria-describedby={totalId}
          onChange={(event) => {
            if (/^\d*$/.test(event.target.value)) setDraftPage(event.target.value);
          }}
          onBlur={commitPage}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitPage();
              event.currentTarget.select();
            } else if (event.key === 'Escape') {
              setDraftPage(String(safeCurrentPage));
            }
          }}
        />
        <span id={totalId}>{en ? 'of' : 'de'} {safeTotalPages}</span>
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {en ? 'Page' : 'P\u00e1gina'} {safeCurrentPage} {en ? 'of' : 'de'} {safeTotalPages}
      </span>

      <button
        type="button"
        className="step-nav-control"
        onClick={() => {
          if (!nextEnabled) return;
          if (onNext) onNext();
          else onPageChange(safeCurrentPage + 1);
        }}
        disabled={!nextEnabled}
        aria-label={en ? 'Next page' : 'P\u00e1gina siguiente'}
      >
        <ArrowRight aria-hidden="true" />
      </button>
    </nav>
  );
}
