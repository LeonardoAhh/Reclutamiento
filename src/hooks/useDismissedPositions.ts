import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'reclutamiento_dismissed_positions';
const EVENT_KEY = 'reclutamiento_dismissed_positions_change';

export function useDismissedPositions() {
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading dismissed keys from localStorage', e);
    }
    return new Set();
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      setDismissedKeys(new Set(customEvent.detail));
    };
    window.addEventListener(EVENT_KEY, handleSync);
    return () => window.removeEventListener(EVENT_KEY, handleSync);
  }, []);

  const updateGlobalState = useCallback((newSet: Set<string>) => {
    const array = Array.from(newSet);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (e) {
      console.error('Error saving dismissed keys to localStorage', e);
    }
    setDismissedKeys(newSet);
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: array }));
  }, []);

  const toggleDismiss = useCallback((key: string) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      updateGlobalState(next);
      return next;
    });
  }, [updateGlobalState]);

  const clearDismissed = useCallback(() => {
    updateGlobalState(new Set());
  }, [updateGlobalState]);

  return { dismissedKeys, toggleDismiss, clearDismissed, setDismissedKeys: updateGlobalState };
}
