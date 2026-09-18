export default function RouteTabs({ rutas, rutaActivaId, onSeleccionar }) {
  const rutasOrdenadas = [...rutas].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  return (
    <nav className="mb-1" role="tablist" aria-label="Seleccionar ruta de transporte">
      {/* ========== MÓVIL: Grid limpio, sin caja envolvente ========== */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {rutasOrdenadas.map((ruta) => {
          const activa = ruta.id === rutaActivaId;
          return (
            <button
              key={ruta.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => onSeleccionar(ruta.id)}
              className={`
                select-none rounded-sm py-2 text-caption-md font-medium
                transition-all duration-200 active:scale-95
                ${activa
                  ? 'bg-surface text-ink border border-hairline shadow-soft'
                  : 'bg-surface-soft text-mute border border-transparent hover:bg-surface-card hover:text-ink'
                }
              `}
            >
              {ruta.id}
            </button>
          );
        })}
      </div>

      {/* ========== DESKTOP: Segmented control horizontal ========== */}
      <div className="hidden md:flex md:gap-1 md:rounded-md md:border md:border-hairline md:bg-surface-soft md:p-1 md:overflow-hidden">
        {rutasOrdenadas.map((ruta) => {
          const activa = ruta.id === rutaActivaId;
          return (
            <button
              key={ruta.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => onSeleccionar(ruta.id)}
              className={`
                select-none rounded-sm px-5 py-2 text-button-md font-medium
                transition-all duration-200 active:scale-95 md:flex-shrink-0
                ${activa
                  ? 'bg-surface text-ink shadow-soft'
                  : 'text-mute hover:bg-surface-card hover:text-ink'
                }
              `}
            >
              {ruta.id}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
