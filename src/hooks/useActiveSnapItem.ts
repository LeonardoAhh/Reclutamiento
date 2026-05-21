import { useEffect, useState, type RefObject } from 'react';

/**
 * Devuelve el `data-id` del hijo más visible dentro de un scroll container.
 *
 * Diseñado para carruseles mobile con `scroll-snap` (eje X u Y): se monta
 * un `IntersectionObserver` con `root = container` y se calcula en cada
 * cambio cuál hijo tiene la mayor `intersectionRatio`. Ese ítem se marca
 * como "activo" y el llamador puede aplicar estilos de expansión / focus.
 *
 * Best practices:
 *  - El observer se desmonta al cambiar `container` o desmontar el hook.
 *  - Threshold escalonado (0..1 paso 0.1) para granularidad sin overhead.
 *  - `rootMargin` configurable (útil cuando hay padding interno o headers).
 *
 * @param containerRef Ref al elemento scrollable (overflow visible o auto).
 * @param itemSelector Selector CSS de los ítems candidatos (e.g. `[data-snap-id]`).
 * @param options.rootMargin Margen del root para compensar paddings.
 * @returns El `data-snap-id` del ítem activo, o `null` si aún no se mide.
 */
export function useActiveSnapItem(
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  options: { rootMargin?: string } = {}
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { rootMargin } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    // Cache de ratios por elemento — el observer entrega entries parciales
    // (sólo cambios), así que mantenemos el estado completo aquí.
    const ratios = new WeakMap<Element, number>();
    const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    if (items.length === 0) return;

    function computeActive() {
      let best: { id: string | null; ratio: number } = { id: null, ratio: 0 };
      for (const el of items) {
        const r = ratios.get(el) ?? 0;
        if (r > best.ratio) {
          const id = el.getAttribute('data-snap-id');
          if (id) best = { id, ratio: r };
        }
      }
      if (best.id) setActiveId(best.id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        computeActive();
      },
      {
        root: container,
        rootMargin: rootMargin ?? '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const el of items) observer.observe(el);

    return () => observer.disconnect();
  }, [containerRef, itemSelector, rootMargin]);

  return activeId;
}
