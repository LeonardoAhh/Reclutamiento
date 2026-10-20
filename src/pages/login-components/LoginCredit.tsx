import { useEffect, useState } from 'react';
import { CodeXml } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

const PREFIX = 'Designed by ';
const AUTHOR = 'LAHH';
const CREDIT = PREFIX + AUTHOR;
const TYPING_INTERVAL_MS = 100;
const COMPLETED_PAUSE_MS = 1800;

export function LoginCredit() {
  const reducedMotion = useReducedMotion();
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(
      () => setLength(current => current === CREDIT.length ? 0 : current + 1),
      length === CREDIT.length ? COMPLETED_PAUSE_MS : TYPING_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [length, reducedMotion]);

  const visibleLength = reducedMotion ? CREDIT.length : length;
  return (
    <p className="login-credit" lang="en">
      <CodeXml size="var(--icon-size-sm)" aria-hidden="true" />
      <span className="sr-only">{CREDIT}</span>
      <span className="login-credit__text" aria-hidden="true">
        <span className="login-credit__measure">{PREFIX}<strong>{AUTHOR}</strong></span>
        <span className="login-credit__typed">{PREFIX.slice(0, visibleLength)}<strong>{AUTHOR.slice(0, Math.max(0, visibleLength - PREFIX.length))}</strong></span>
      </span>
    </p>
  );
}
