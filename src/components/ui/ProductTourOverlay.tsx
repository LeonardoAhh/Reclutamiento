import { createPortal } from 'react-dom';
import type { TargetBounds } from '@/features/onboarding/productTourUtils';

export function ProductTourOverlay({ bounds }: { bounds: TargetBounds | null }) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = bounds?.spotlightPadding ?? 0;
  const left = bounds ? bounds.left - padding : 0;
  const right = bounds ? bounds.right + padding : 0;
  const top = bounds ? bounds.top - padding : 0;
  const bottom = bounds ? bounds.bottom + padding : 0;
  const radii = bounds
    ? {
        topLeft: bounds.cornerRadii.topLeft + padding,
        topRight: bounds.cornerRadii.topRight + padding,
        bottomRight: bounds.cornerRadii.bottomRight + padding,
        bottomLeft: bounds.cornerRadii.bottomLeft + padding,
      }
    : null;
  const hole = bounds && radii
    ? [
        `M ${left + radii.topLeft} ${top}`,
        `H ${right - radii.topRight}`,
        `A ${radii.topRight} ${radii.topRight} 0 0 1 ${right} ${top + radii.topRight}`,
        `V ${bottom - radii.bottomRight}`,
        `A ${radii.bottomRight} ${radii.bottomRight} 0 0 1 ${right - radii.bottomRight} ${bottom}`,
        `H ${left + radii.bottomLeft}`,
        `A ${radii.bottomLeft} ${radii.bottomLeft} 0 0 1 ${left} ${bottom - radii.bottomLeft}`,
        `V ${top + radii.topLeft}`,
        `A ${radii.topLeft} ${radii.topLeft} 0 0 1 ${left + radii.topLeft} ${top}`,
        'Z',
      ].join(' ')
    : '';
  const scrimPath = `M 0 0 H ${viewportWidth} V ${viewportHeight} H 0 Z ${hole}`;

  return (
    <>
      {createPortal(
        <svg className="product-tour__scrim" aria-hidden="true" focusable="false">
          {bounds ? <path d={scrimPath} fillRule="evenodd" /> : <rect width="100%" height="100%" />}
        </svg>,
        document.body,
      )}
      {bounds && radii &&
        createPortal(
          <div
            className="product-tour__spotlight"
            style={{
              top,
              left,
              width: bounds.width + padding * 2,
              height: bounds.height + padding * 2,
              borderRadius: Object.values(radii)
                .map((radius) => `${radius}px`)
                .join(' '),
            }}
            aria-hidden="true"
          />,
          document.body,
        )}
    </>
  );
}
