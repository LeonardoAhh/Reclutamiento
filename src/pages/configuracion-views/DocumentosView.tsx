import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ConstanciaFiscal } from '@/components/documentos/ConstanciaFiscal';
import { CuestionarioSalud } from '@/components/documentos/CuestionarioSalud';
import { DatosGenerales } from '@/components/documentos/DatosGenerales';
import { Download, FileText } from 'lucide-react';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';

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

export function DocumentosView() {
  const constanciaRef = useRef<HTMLDivElement>(null);
  const saludRef = useRef<HTMLDivElement>(null);
  const generalesRef = useRef<HTMLDivElement>(null);
  const [activeDoc, setActiveDoc] = useState<'constancia' | 'salud' | 'generales'>('constancia');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const loadHtml2Canvas = useHtml2CanvasLoader();

  const handleDownload = useCallback(async () => {
    const element = activeDoc === 'constancia' ? constanciaRef.current :
                    activeDoc === 'salud' ? saludRef.current :
                    generalesRef.current;
    if (!element) return;

    setStatus('loading');
    setErrorMsg(null);

    // Retraso artificial para "pensar" como pidió el usuario
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc: Document) => {
          if (activeDoc === 'constancia') {
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
          }
        },
      });

      /* ✅ Nombre genérico — sin depender de propiedades inexistentes en Profile */
      const timestamp = new Date().toISOString().split('T')[0];
      let prefix = 'constancia_fiscal';
      if (activeDoc === 'salud') prefix = 'cuestionario_salud';
      if (activeDoc === 'generales') prefix = 'datos_generales';
      let extension = 'png';
      if (activeDoc === 'salud' || activeDoc === 'generales') extension = 'pdf';
      
      const fileName = `${prefix}_${timestamp}.${extension}`;

      let dataUrl = '';
      let fileType = '';
      let blobData: Blob;

      const imgData = canvas.toDataURL('image/png');

      if (extension === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'letter' // Carta
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Ajustamos la imagen al ancho de la hoja
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        blobData = pdf.output('blob');
        dataUrl = URL.createObjectURL(blobData);
        fileType = 'application/pdf';
      } else {
        blobData = await (await fetch(imgData)).blob();
        dataUrl = imgData;
        fileType = 'image/png';
      }
      
      // Intentar usar la API nativa de Compartir/Guardar de iOS/Android (solo en móviles)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.share) {
        try {
          const file = new File([blobData], fileName, { type: fileType });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: activeDoc === 'constancia' ? 'Constancia Fiscal' : 'Documento',
            });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
            return; // Termina con éxito si se compartió/guardó nativamente
          }
        } catch (e) {
          console.warn('Fallo al intentar usar Web Share API', e);
        }
      }

      // Fallback estándar para PC y Android
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      
      if (extension === 'pdf') {
        URL.revokeObjectURL(dataUrl);
      }
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Error al generar la imagen:', err);
      setStatus('error');
      setErrorMsg('Hubo un error al generar la imagen. Intenta recargando la página.');
    }
  }, [loadHtml2Canvas, activeDoc]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const hasError = status === 'error';

  return (
    <section className="documentos-view config-page__content">
      <header className="config-page__header">
        <h2 className="config-page__title">
          <FileText size={24} className="text-primary" aria-hidden="true" />
          Documentos
        </h2>
        <p className="config-page__subtitle">
          Genera y descarga documentos oficiales para impresión o resguardo.
        </p>
      </header>

      {hasError && (
        <div role="alert" aria-live="assertive" className="documentos-error">
          <p className="type-body-sm text-error">{errorMsg}</p>
        </div>
      )}

      <div className="documentos-toolbar">
        <div className="documentos-tabs">
          <button 
            className={`btn ${activeDoc === 'constancia' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveDoc('constancia')}
          >Constancia Fiscal</button>
          <button 
            className={`btn ${activeDoc === 'salud' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveDoc('salud')}
          >Cuestionario de Salud</button>
          <button 
            className={`btn ${activeDoc === 'generales' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveDoc('generales')}
          >Datos Generales</button>
        </div>

        <AnimatedSubmitButton
          type="button"
          onClick={handleDownload}
          isSubmitting={isLoading}
          isSuccess={isSuccess}
          idleIcon={Download}
          idleText={activeDoc === 'constancia' ? 'Guardar Imagen' : 'Descargar PDF'}
          loadingText="Generando…"
          successText="¡Listo!"
          className="btn-primary"
        />
      </div>

      <div className="documentos-preview" style={{ overflow: 'auto', padding: 'var(--spacing-md)' }}>
        {activeDoc === 'constancia' && (
          <section
            id="constancia-fiscal-node"
            ref={constanciaRef}
            className="card constancia-capture"
            aria-label="Constancia de situación fiscal"
          >
            <ConstanciaFiscal />
          </section>
        )}
        
        {activeDoc === 'salud' && (
          <section ref={saludRef} style={{ background: 'var(--color-surface)', width: 'fit-content', margin: '0 auto' }}>
            <CuestionarioSalud />
          </section>
        )}

        {activeDoc === 'generales' && (
          <section ref={generalesRef} style={{ background: 'var(--color-surface)', width: 'fit-content', margin: '0 auto' }}>
            <DatosGenerales />
          </section>
        )}
      </div>
    </section>
  );
}
