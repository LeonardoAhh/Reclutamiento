import { useCallback, useEffect, useRef } from 'react';

/**
 * Makes a transient overlay behave like a navigable page:
 * opening pushes a history entry, and the device/browser Back button
 * (or Esc / the close button via requestClose) dismisses it without
 * leaving the app. Returns a function that closes via history.back().
 */
export default function useHistoryDismiss(onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    window.history.pushState({ stopDetail: true }, '');

    const handlePop = () => onCloseRef.current?.();
    window.addEventListener('popstate', handlePop);

    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return useCallback(() => {
    window.history.back();
  }, []);
}
