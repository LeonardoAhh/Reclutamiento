import { useRef, useState } from 'react';
import { Download, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import DocumentMockup from '../DocumentMockup';

export default function CSFMockup() {
  const mockupRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fecha actual de Querétaro, México (sin Intl para compatibilidad con Playwright)
  const now = new Date();
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  
  const day = now.getDate().toString().padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const formattedDate = `${day} DE ${month} DE ${year}`;
  const location = 'GUSTAVO A MADERO, CIUDAD DE MÉXICO';

  // Calcular fecha de hace 3 meses para la nota
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoDay = threeMonthsAgo.getDate().toString().padStart(2, '0');
  const threeMonthsAgoMonth = months[threeMonthsAgo.getMonth()].toLowerCase();
  const threeMonthsAgoYear = threeMonthsAgo.getFullYear();
  const threeMonthsAgoFormatted = `${threeMonthsAgoDay} de ${threeMonthsAgoMonth} de ${threeMonthsAgoYear}`;

  const handleDownload = async () => {
    if (!mockupRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(mockupRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `constancia-situacion-fiscal-ejemplo-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar imagen:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón de descarga */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-heading-md font-heading-md text-ink">
          Ejemplo de Constancia de Situación Fiscal
        </h2>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          data-testid="download-csf-button"
          className="gap-2"
        >
          <Download className="size-4" />
          {isDownloading ? 'Generando...' : 'Descargar Ejemplo'}
        </Button>
      </div>

      {/* Contenedor completo para descarga - incluye todo */}
      <div ref={mockupRef} className="space-y-6">
        {/* Información importante */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4" data-testid="csf-info">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-primary" />
            <div className="space-y-2 text-caption-md sm:text-body-md">
              <p className="font-semibold text-ink">
                Aspectos importantes de la Constancia de Situación Fiscal:
              </p>
              <ul className="space-y-1 text-body">
                <li className="flex items-start gap-2">
                  <Calendar className="size-4 shrink-0 mt-0.5 text-primary" />
                  <span>
                    <strong>Fecha de emisión:</strong> No debe ser mayor a 3 meses (posterior al{' '}
                    {threeMonthsAgoFormatted})
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary" aria-hidden="true">✓</span>
                  <span>
                    <strong>Encabezado correcto:</strong> Debe decir &ldquo;CONSTANCIA DE SITUACIÓN FISCAL&rdquo; con
                    los logos oficiales de Hacienda y SAT
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mockup del documento */}
        <DocumentMockup>
          <CSFDocument location={location} date={formattedDate} />
        </DocumentMockup>

        {/* Notas adicionales */}
        <div className="rounded-lg border border-hairline bg-surface-soft p-4">
          <h3 className="text-body-strong font-body-strong mb-2 text-ink">
            Notas adicionales
          </h3>
          <ul className="space-y-1.5 text-caption-md sm:text-body-md text-body">
            <li className="flex gap-2">
              <span className="text-primary" aria-hidden="true">[+]</span>
              <span>
                La Constancia de Situación Fiscal se puede descargar desde el portal del SAT con tu RFC
                y contraseña
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary" aria-hidden="true">[+]</span>
              <span>
                Verifica que todos los datos sean legibles y que el documento esté completo
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary" aria-hidden="true">[+]</span>
              <span>
                La fecha de emisión se actualiza automáticamente en este ejemplo para mostrar una fecha
                válida actual
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Componente del documento con el diseño del SAT
function CSFDocument({ location, date }) {
  return (
    <div className="space-y-6 bg-white p-8 sm:p-12" data-testid="csf-document">
      {/* Header con logos */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink">
            Secretaría de Hacienda
          </div>
          <div className="text-xs font-bold uppercase text-[#962D45]">
            HACIENDA
          </div>
          <div className="text-[9px] text-mute">
            SECRETARÍA DE HACIENDA Y CRÉDITO PÚBLICO
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs font-bold uppercase text-[#004C97]">
            SAT
          </div>
          <div className="text-[9px] text-mute">
            SERVICIO DE ADMINISTRACIÓN TRIBUTARIA
          </div>
        </div>
      </div>

      {/* Título principal - ASPECTO IMPORTANTE #2 */}
      <div className="rounded-md border-2 border-primary bg-primary/5 p-4">
        <h1 className="text-center text-xl sm:text-2xl font-bold uppercase tracking-tight text-ink">
          CONSTANCIA DE SITUACIÓN FISCAL
        </h1>
      </div>

      {/* Información del contribuyente */}
      <div className="space-y-4">
        {/* QR Code simulado */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex shrink-0 items-center justify-center">
            <div className="size-24 rounded-md border-2 border-ink bg-white p-2">
              <svg viewBox="0 0 100 100" className="size-full">
                <rect width="100" height="100" fill="white" />
                {/* Patrón QR simplificado */}
                <rect x="10" y="10" width="15" height="15" fill="black" />
                <rect x="75" y="10" width="15" height="15" fill="black" />
                <rect x="10" y="75" width="15" height="15" fill="black" />
                <rect x="30" y="20" width="5" height="5" fill="black" />
                <rect x="45" y="25" width="10" height="10" fill="black" />
                <rect x="65" y="30" width="8" height="8" fill="black" />
                <rect x="25" y="45" width="12" height="12" fill="black" />
                <rect x="50" y="50" width="15" height="15" fill="black" />
                <rect x="30" y="70" width="8" height="8" fill="black" />
                <rect x="60" y="75" width="10" height="10" fill="black" />
              </svg>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-mute">RFC</div>
              <div className="font-mono text-lg font-bold text-ink">AAPL790804119</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-mute">
                Registro Federal de Contribuyentes
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-mute">Nombre, denominación o razón social</div>
              <div className="text-sm font-semibold text-ink">ULISES ALCÁNTARA PÉREZ</div>
            </div>
          </div>
        </div>

        {/* Lugar y fecha de emisión - ASPECTO IMPORTANTE #1 */}
        <div className="mt-6 rounded-md border-2 border-primary bg-primary/5 p-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-ink">Lugar y Fecha de Emisión</div>
            <div className="text-base font-semibold text-ink">
              {location} A {date}
            </div>
          </div>
        </div>

        {/* Código de barras simulado */}
        <div className="mt-6 flex justify-center">
          <div className="space-y-1">
            <svg viewBox="0 0 200 40" className="h-10 w-full max-w-xs">
              <rect x="5" y="0" width="2" height="40" fill="black" />
              <rect x="10" y="0" width="1" height="40" fill="black" />
              <rect x="13" y="0" width="3" height="40" fill="black" />
              <rect x="18" y="0" width="1" height="40" fill="black" />
              <rect x="22" y="0" width="2" height="40" fill="black" />
              <rect x="27" y="0" width="4" height="40" fill="black" />
              <rect x="33" y="0" width="1" height="40" fill="black" />
              <rect x="37" y="0" width="2" height="40" fill="black" />
              <rect x="42" y="0" width="3" height="40" fill="black" />
              <rect x="48" y="0" width="1" height="40" fill="black" />
              <rect x="52" y="0" width="2" height="40" fill="black" />
              <rect x="57" y="0" width="4" height="40" fill="black" />
              <rect x="64" y="0" width="1" height="40" fill="black" />
              <rect x="68" y="0" width="3" height="40" fill="black" />
              <rect x="74" y="0" width="2" height="40" fill="black" />
              <rect x="79" y="0" width="1" height="40" fill="black" />
              <rect x="83" y="0" width="4" height="40" fill="black" />
              <rect x="90" y="0" width="2" height="40" fill="black" />
              <rect x="95" y="0" width="1" height="40" fill="black" />
              <rect x="99" y="0" width="3" height="40" fill="black" />
              <rect x="105" y="0" width="2" height="40" fill="black" />
              <rect x="110" y="0" width="4" height="40" fill="black" />
              <rect x="117" y="0" width="1" height="40" fill="black" />
              <rect x="121" y="0" width="2" height="40" fill="black" />
              <rect x="126" y="0" width="3" height="40" fill="black" />
              <rect x="132" y="0" width="1" height="40" fill="black" />
              <rect x="136" y="0" width="4" height="40" fill="black" />
              <rect x="143" y="0" width="2" height="40" fill="black" />
              <rect x="148" y="0" width="1" height="40" fill="black" />
              <rect x="152" y="0" width="3" height="40" fill="black" />
              <rect x="158" y="0" width="2" height="40" fill="black" />
              <rect x="163" y="0" width="4" height="40" fill="black" />
              <rect x="170" y="0" width="1" height="40" fill="black" />
              <rect x="174" y="0" width="2" height="40" fill="black" />
              <rect x="179" y="0" width="3" height="40" fill="black" />
              <rect x="185" y="0" width="1" height="40" fill="black" />
              <rect x="189" y="0" width="2" height="40" fill="black" />
            </svg>
            <div className="text-center font-mono text-xs text-ink">AAPL790804119</div>
          </div>
        </div>
      </div>

      {/* Tablas de información */}
      <div className="space-y-6 pt-6">
        {/* Actividades Económicas */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-ink">Actividades Económicas:</h2>
          <div className="overflow-hidden rounded-md border border-hairline">
            <table className="w-full text-xs">
              <thead className="bg-surface-card">
                <tr className="border-b border-hairline">
                  <th className="border-r border-hairline p-2 text-left font-bold">Orden</th>
                  <th className="border-r border-hairline p-2 text-left font-bold">
                    Actividad Económica
                  </th>
                  <th className="border-r border-hairline p-2 text-left font-bold">Porcentaje</th>
                  <th className="border-r border-hairline p-2 text-left font-bold">Fecha Inicio</th>
                  <th className="p-2 text-left font-bold">Fecha Fin</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="border-r border-hairline p-2">1</td>
                  <td className="border-r border-hairline p-2">Asalariado</td>
                  <td className="border-r border-hairline p-2">100</td>
                  <td className="border-r border-hairline p-2">30/01/2018</td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Regímenes */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-ink">Regímenes:</h2>
          <div className="overflow-hidden rounded-md border border-hairline">
            <table className="w-full text-xs">
              <thead className="bg-surface-card">
                <tr className="border-b border-hairline">
                  <th className="border-r border-hairline p-2 text-left font-bold">Régimen</th>
                  <th className="border-r border-hairline p-2 text-left font-bold">Fecha Inicio</th>
                  <th className="p-2 text-left font-bold">Fecha Fin</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="border-r border-hairline p-2">
                    Régimen de Sueldos y Salarios e Ingresos Asimilados a Salarios
                  </td>
                  <td className="border-r border-hairline p-2">30/01/2018</td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* IdCIF */}
      <div className="mt-6 text-center text-xs text-mute">
        <div>IdCIF: 1609040216</div>
        <div className="mt-1 font-semibold">VALIDA TU INFORMACIÓN FISCAL</div>
      </div>
    </div>
  );
}
