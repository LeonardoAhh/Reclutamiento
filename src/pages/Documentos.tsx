import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ConstanciaFiscal } from '@/components/documentos/ConstanciaFiscal';
import { Download, Loader2 } from 'lucide-react';

/* ── Tipado mínimo para html2canvas ── */
type Html2CanvasFn = (
  element: HTMLElement,
  options?: Record<string, unknown>
) => Promise<HTMLCanvasElement>;

function useHtml2CanvasLoader() {
  const load = useCallback((): Promise<Html2CanvasFn> => {
    return new Promise((resolve, reject) => {
      const win = window as unknown as { html2canvas?: Html2CanvasFn };
      if (win.html2canvas) {
        resolve(win.html2canvas);
        return;
      }

      const script = document.createElement('script');
      script.src = '/html2canvas.min.js';
      script.async = true;

      const cleanup = () => script.remove();

      script.onload = () => {
        if (win.html2canvas) {
          resolve(win.html2canvas);
        } else {
          reject(new Error('La librería de captura no se inicializó correctamente'));
        }
        cleanup();
      };

      script.onerror = () => {
        reject(new Error('No se pudo cargar la librería de captura'));
        cleanup();
      };

      document.body.appendChild(script);
    });
  }, []);

  return load;
}

export function Documentos() {
  const constanciaRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const loadHtml2Canvas = useHtml2CanvasLoader();

  const handleDownload = useCallback(async () => {
    const element = constanciaRef.current;
    if (!element) return;

    setStatus('loading');
    setErrorMsg(null);

    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc: Document) => {
          const clonedNode = clonedDoc.getElementById('constancia-fiscal-node');
          if (!clonedNode) return;

          const node = clonedNode as HTMLElement;
          node.style.width = '1000px';
          node.style.maxWidth = 'none';
          node.style.margin = '0 auto';
          node.style.padding = '32px';

          const wrappers = clonedNode.querySelectorAll<HTMLElement>('.constancia-table-wrapper');
          wrappers.forEach((w) => {
            w.style.overflowX = 'visible';
          });
        },
      });

      /* ✅ Nombre genérico — sin depender de propiedades inexistentes en Profile */
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `constancia_fiscal_${timestamp}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus('idle');
    } catch (err) {
      console.error('Error al generar la imagen:', err);
      setStatus('error');
      setErrorMsg('Hubo un error al generar la imagen. Intenta recargando la página.');
    }
  }, [loadHtml2Canvas]);

  const isLoading = status === 'loading';
  const hasError = status === 'error';

  return (
    <main className="container documentos-page">
      <header className="documentos-header">
        <h1 className="type-display-lg text-ink">Documentos</h1>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-live="polite"
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} aria-hidden="true" className="spin" />
              <span>Generando…</span>
              <span className="sr-only">Descarga en progreso</span>
            </>
          ) : (
            <>
              <Download size={16} aria-hidden="true" />
              <span>Guardar Imagen</span>
            </>
          )}
        </button>
      </header>

      {hasError && (
        <div role="alert" aria-live="assertive" className="documentos-error">
          <p className="type-body-sm text-error">{errorMsg}</p>
        </div>
      )}

      <section
        id="constancia-fiscal-node"
        ref={constanciaRef}
        className="card constancia-capture"
        aria-label="Constancia de situación fiscal"
      >
        <ConstanciaFiscal />
      </section>
    </main>
  );
}
