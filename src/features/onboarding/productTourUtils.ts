export interface TargetBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  cornerRadii: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
  spotlightPadding: number;
}

let cachedGeometryTokens: {
  key: string;
  spotlightPadding: number;
  controlRadius: number;
} | null = null;

function getTourGeometryTokens() {
  const rootStyles = getComputedStyle(document.documentElement);
  const key = [
    rootStyles.fontSize,
    rootStyles.getPropertyValue('--design-spacing-xxs'),
    rootStyles.getPropertyValue('--radius-control'),
  ].join('|');
  if (cachedGeometryTokens?.key === key) return cachedGeometryTokens;

  const probe = document.createElement('span');
  probe.style.cssText = [
    'display:block',
    'position:fixed',
    'visibility:hidden',
    'pointer-events:none',
    'inline-size:var(--design-spacing-xxs)',
    'block-size:var(--design-spacing-xxs)',
    'border-radius:var(--radius-control)',
  ].join(';');
  document.body.append(probe);
  const probeStyles = getComputedStyle(probe);
  const geometryTokens = {
    key,
    spotlightPadding: probe.getBoundingClientRect().width,
    controlRadius: Number.parseFloat(probeStyles.borderTopLeftRadius),
  };
  probe.remove();
  cachedGeometryTokens = geometryTokens;
  return geometryTokens;
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
  const geometryTokens = getTourGeometryTokens();
  const cornerRadii = {
    topLeft: Number.parseFloat(styles.borderTopLeftRadius),
    topRight: Number.parseFloat(styles.borderTopRightRadius),
    bottomRight: Number.parseFloat(styles.borderBottomRightRadius),
    bottomLeft: Number.parseFloat(styles.borderBottomLeftRadius),
  };
  const hasCornerRadius = Object.values(cornerRadii).some((radius) => radius > 0);
  const resolveRadius = (radius: number) => {
    const resolvedRadius = hasCornerRadius ? radius : geometryTokens.controlRadius;
    return Number.isFinite(resolvedRadius)
      ? Math.min(resolvedRadius, rect.width / 2, rect.height / 2)
      : 0;
  };
  const resolvedCornerRadii = {
    topLeft: resolveRadius(cornerRadii.topLeft),
    topRight: resolveRadius(cornerRadii.topRight),
    bottomRight: resolveRadius(cornerRadii.bottomRight),
    bottomLeft: resolveRadius(cornerRadii.bottomLeft),
  };

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    cornerRadii: resolvedCornerRadii,
    spotlightPadding: geometryTokens.spotlightPadding,
  };
}
