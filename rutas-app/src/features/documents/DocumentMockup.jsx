/**
 * DocumentMockup - Componente reutilizable para crear mockups de documentos
 * 
 * Este componente proporciona un "frame" CSS que simula un documento físico
 * con sombra y efecto de papel. Es reutilizable para cualquier tipo de documento.
 * 
 * @example
 * <DocumentMockup>
 *   <TuContenidoDeDocumento />
 * </DocumentMockup>
 */
export default function DocumentMockup({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-4xl ${className}`}>
      {/* Frame exterior con sombra */}
      <div className="relative rounded-lg bg-surface p-4 shadow-soft sm:p-6">
        {/* Marco interior con efecto de papel */}
        <div
          className="relative overflow-hidden rounded-md border border-hairline bg-white shadow-sm"
          data-testid="document-mockup"
        >
          {/* Efecto de textura de papel sutil */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Contenido del documento */}
          <div className="relative">{children}</div>
        </div>

        {/* Indicador de escala para móvil */}
        <div className="mt-4 text-center text-caption-md text-stone sm:hidden">
          Desliza para ver el documento completo
        </div>
      </div>
    </div>
  );
}
