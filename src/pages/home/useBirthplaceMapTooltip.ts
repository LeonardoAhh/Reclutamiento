import { useCallback, useState } from 'react';
import type { ECElementEvent } from 'echarts/core';
import { BIRTHPLACE_COUNTS } from './birthplaceData';

export type BirthplaceMapTooltipData = {
  name: string;
  count: number | undefined;
  x: number;
  y: number;
};

const countsByState = new Map<string, number>(BIRTHPLACE_COUNTS.map(({ name, count }) => [name, count]));

export function useBirthplaceMapTooltip() {
  const [tooltip, setTooltip] = useState<BirthplaceMapTooltipData | null>(null);
  const hideTooltip = useCallback(() => setTooltip(null), []);
  const showTooltip = useCallback((event: ECElementEvent) => {
    if (!event.name || !event.event) return;
    const name = event.name === 'Estado de México' ? 'México' : event.name;
    setTooltip({
      name: name === 'México' ? 'Estado de México' : name,
      count: countsByState.get(name),
      x: event.event.offsetX,
      y: event.event.offsetY,
    });
  }, []);

  return { tooltip, showTooltip, hideTooltip };
}
