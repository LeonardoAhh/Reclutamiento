import { createPortal } from 'react-dom';
import type { TargetBounds } from '@/features/onboarding/productTourUtils';

export function ProductTourOverlay({ bounds }: { bounds: TargetBounds | null }) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const hole = bounds
    ? [
        `M ${bounds.left + bounds.radius} ${bounds.top}`,
        `H ${bounds.right - bounds.radius}`,
        `Q ${bounds.right} ${bounds.top} ${bounds.right} ${bounds.top + bounds.radius}`,
        `V ${bounds.bottom - bounds.radius}`,
        `Q ${bounds.right} ${bounds.bottom} ${bounds.right - bounds.radius} ${bounds.bottom}`,
        `H ${bounds.left + bounds.radius}`,
        `Q ${bounds.left} ${bounds.bottom} ${bounds.left} ${bounds.bottom - bounds.radius}`,
        `V ${bounds.top + bounds.radius}`,
        `Q ${bounds.left} ${bounds.top} ${bounds.left + bounds.radius} ${bounds.top}`,
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
      {bounds &&
        createPortal(
          <div
            className="product-tour__spotlight"
            style={{
              top: bounds.top,
              left: bounds.left,
              width: bounds.width,
              height: bounds.height,
              borderRadius: bounds.radius,
            }}
            aria-hidden="true"
          />,
          document.body,
        )}
    </>
  );
}
