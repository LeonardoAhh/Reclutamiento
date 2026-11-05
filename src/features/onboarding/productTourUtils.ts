export interface TargetBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

export function waitForTarget(selector: string, signal: AbortSignal): Promise<HTMLElement | null> {
  const findTarget = () => document.querySelector<HTMLElement>(selector);
  const existingTarget = findTarget();
  if (existingTarget) return Promise.resolve(existingTarget);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const target = findTarget();
      if (target) finish(target);
    });
    const timeout = window.setTimeout(() => finish(null), 2000);
    const finish = (target: HTMLElement | null) => {
      observer.disconnect();
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', handleAbort);
      resolve(target);
    };
    const handleAbort = () => finish(null);

    if (signal.aborted) {
      finish(null);
      return;
    }

    observer.observe(document.documentElement, { childList: true, subtree: true });
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

export function measureTourTarget(target: HTMLElement | null): TargetBounds | null {
  if (!target) return null;
  const rect = target.getBoundingClientRect();
  const styles = getComputedStyle(target);
  const targetRadius = Number.parseFloat(styles.borderTopLeftRadius);
  const controlRadius = Number.parseFloat(styles.getPropertyValue('--radius-control'));
  const radius = Number.isFinite(targetRadius) && targetRadius > 0 ? targetRadius : controlRadius;
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    radius: Number.isFinite(radius) ? Math.min(radius, rect.width / 2, rect.height / 2) : 0,
  };
}
