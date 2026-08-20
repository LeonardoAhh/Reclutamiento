import { useEffect } from 'react';

/** Locks body scroll while a full-screen overlay is mounted. */
export default function useBodyScrollLock() {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);
}
