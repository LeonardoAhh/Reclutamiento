import { useEffect, useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import StopDetail from './StopDetail';

export default function StopList({ ruta, paradas, targetStopNo }) {
  const isMobile = useIsMobile();
  const [paradaActiva, setParadaActiva] = useState(null);
  const filas = paradas ?? ruta.paradas;

  useEffect(() => {
    if (targetStopNo == null || !isMobile) return;
    const p = filas.find((x) => x.no === targetStopNo);
    if (p) setParadaActiva(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetStopNo, isMobile]);

  return (
    <div className="mt-6" data-testid="stop-list">
      <p
        className="mb-3 flex items-center gap-2 text-caption-md text-mute"
        data-testid="stop-list-hint"
      >
        <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>Toca una parada para ver su referencia y horarios.</span>
      </p>

      <ul
        className="stagger overflow-hidden rounded-lg border border-hairline bg-surface"
        role="list"
      >
        {filas.map((parada, idx) => (
          <li key={parada.no}>
            <button
              type="button"
              onClick={() => setParadaActiva(parada)}
              data-testid={`stop-row-${parada.no}`}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-card ${
                idx !== 0 ? 'border-t border-hairline' : ''
              }`}
            >
              <span className="w-6 flex-shrink-0 text-center text-body-md font-semibold tabular-nums text-ash">
                {parada.no}
              </span>
              <span className="flex-1 text-body-strong font-semibold text-ink">
                {parada.colonia}
              </span>
              <ChevronRight className="size-5 shrink-0 text-ash" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {paradaActiva && (
        <StopDetail
          ruta={ruta}
          parada={paradaActiva}
          onClose={() => setParadaActiva(null)}
        />
      )}
    </div>
  );
}
