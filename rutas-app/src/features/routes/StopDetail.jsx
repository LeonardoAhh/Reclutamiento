import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useHistoryDismiss from '../../hooks/useHistoryDismiss';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

export default function StopDetail({ ruta, parada, onClose }) {
  const closeRef = useRef(null);
  const requestClose = useHistoryDismiss(onClose);
  useBodyScrollLock();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const tituloId = `parada-detalle-${ruta.id}-${parada.no}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      data-testid="stop-detail"
      className="animate-sheet fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas"
    >
      {/* Sheet header */}
      <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-3">
        <span className="text-caption-md uppercase tracking-wide text-mute">
          {ruta.id} · Parada {parada.no}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          data-testid="stop-detail-close"
          aria-label="Cerrar detalle de la parada"
          className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-button-md text-ink shadow-soft hover:bg-surface-card"
        >
          <X className="size-4" />
          Cerrar
        </button>
      </div>

      {/* Sheet body */}
      <div className="px-5 py-6">
        <p className="text-caption-md uppercase tracking-wide text-mute">Colonia</p>
        <h2
          id={tituloId}
          className="mt-1 text-display-mobile font-bold uppercase text-ink"
          data-testid="stop-detail-colonia"
        >
          {parada.colonia}
        </h2>

        <div className="mt-8">
          <p className="text-caption-md uppercase tracking-wide text-mute">
            Referencia
          </p>
          <p className="mt-1 text-body-md text-body" data-testid="stop-detail-referencia">
            {parada.referencia}
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-caption-md uppercase tracking-wide text-mute">
            Horarios
          </p>
          <ul className="overflow-hidden rounded-lg border border-hairline" role="list">
            {ruta.turnos.map((turno, i) => (
              <li
                key={i}
                data-testid={`stop-detail-turno-${i}`}
                className={`flex items-center justify-between px-4 py-3 ${
                  i !== 0 ? 'border-t border-hairline' : ''
                } ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-soft'}`}
              >
                <span className="text-body-strong text-ink">{turno}</span>
                <span
                  className={`text-body-md tabular-nums ${
                    parada.horarios[i] === 'N/A' ? 'text-ash' : 'text-ink'
                  }`}
                >
                  {parada.horarios[i]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
