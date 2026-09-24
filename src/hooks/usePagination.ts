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

export function usePagination<T>(
  items: T[],
  initialPageSize: number = 10,
  initialPage: number = 1,
): UsePaginationResult<T> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  useEffect(() => {
    setPageSizeState(initialPageSize);
  }, [initialPageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
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
    setPageSizeState(size);
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