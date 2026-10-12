import { useState, useMemo, useEffect, useCallback } from "react";

export interface UsePaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  pageItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

function requirePositiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError('Pagination page size must be a positive integer');
  }
  return value;
}

export function usePagination<T>(
  items: T[],
  initialPageSize: number = 10,
  initialPage: number = 1,
): UsePaginationResult<T> {
  const [pageSize, setPageSizeState] = useState(() => requirePositiveInteger(initialPageSize));
  const [storedPage, setCurrentPage] = useState(
    () => Number.isSafeInteger(initialPage) ? Math.max(1, initialPage) : 1,
  );

  const totalItems = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );
  const currentPage = Math.min(storedPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  useEffect(() => {
    setPageSizeState(requirePositiveInteger(initialPageSize));
  }, [initialPageSize]);

  useEffect(() => {
    if (storedPage > totalPages) setCurrentPage(totalPages);
  }, [storedPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      if (!Number.isSafeInteger(page)) return;
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(requirePositiveInteger(size));
  }, []);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}
