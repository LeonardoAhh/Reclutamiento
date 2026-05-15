import { useCallback, useEffect, useMemo, useState } from 'react';
import './KpiReveal.css';

const STORAGE_KEY = 'kpis_revealed_v1';

function loadRevealed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function persistRevealed(set: Set<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // sessionStorage unavailable / quota exceeded; ignore — reveal still works in-memory.
  }
}

interface KpiRevealContext {
  isRevealed: (id: string) => boolean;
  reveal: (id: string) => void;
  hide: (id: string) => void;
  hideAll: () => void;
}

export function useKpiReveal(): KpiRevealContext {
  const [revealed, setRevealed] = useState<Set<string>>(() => loadRevealed());

  useEffect(() => {
    persistRevealed(revealed);
  }, [revealed]);

  const isRevealed = useCallback((id: string) => revealed.has(id), [revealed]);

  const reveal = useCallback((id: string) => {
    setRevealed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const hide = useCallback((id: string) => {
    setRevealed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const hideAll = useCallback(() => {
    setRevealed((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  return useMemo(
    () => ({ isRevealed, reveal, hide, hideAll }),
    [isRevealed, reveal, hide, hideAll]
  );
}

interface KpiRevealProps {
  id: string;
  label: string;
  revealed: boolean;
  onReveal: () => void;
  onHide: () => void;
  children: React.ReactNode;
}

export function KpiReveal({
  id,
  label,
  revealed,
  onReveal,
  onHide,
  children,
}: KpiRevealProps) {
  function handleClick() {
    if (revealed) onHide();
    else onReveal();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      className={`kpi-reveal${revealed ? ' kpi-reveal--revealed' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={
        revealed
          ? `Ocultar KPI ${label}`
          : `Mostrar KPI ${label}`
      }
      data-kpi-id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="kpi-reveal__inner">{children}</div>
      {!revealed && (
        <span className="kpi-reveal__hint" aria-hidden="true">
          Click para mostrar
        </span>
      )}
    </div>
  );
}
