import { useMemo, useState } from 'react';
import './ConstanciaFiscal.css';

/* ── Tipado ── */
interface ConstanciaFiscalProps {
  rfc?: string;
  nombre?: string;
  idCif?: string;
  lugarFecha?: string;
  qrSrc?: string;
  barcodeSrc?: string;
  logosSrc?: string;
}

/* ── Componente de imagen con fallback ── */
function SafeImage({
  src,
  alt,
  className,
  wrapperClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={wrapperClassName} role="img" aria-label={alt}>
        <span className="constancia-img-fallback" aria-hidden="true">
          ⚠
        </span>
        <span className="sr-only">Imagen no disponible: {alt}</span>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <img
        src={src}
        alt={alt}
        className={className}
        crossOrigin="anonymous"
        onError={() => setError(true)}
      />
    </div>
  );
}

export function ConstanciaFiscal({
  rfc = 'XAXX010101000',
  nombre = 'JOSEFA ORTIZ DE DOMINGUEZ',
  idCif = '12345678901',
  lugarFecha,
  qrSrc,
  barcodeSrc,
  logosSrc,
}: ConstanciaFiscalProps) {
  const defaultLugarFecha = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formatted = formatter.format(new Date()).toUpperCase();
    return `QUERÉTARO, QUERÉTARO A ${formatted}`;
  }, []);

  const isoDate = useMemo(() => new Date().toISOString(), []);
  const displayLugarFecha = lugarFecha || defaultLugarFecha;

  const qrUrl = useMemo(
    () =>
      qrSrc ||
      `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D1=10&D2=1&D3=${idCif}_${rfc}`,
    [qrSrc, idCif, rfc]
  );

  const barcodeUrl = useMemo(
    () =>
      barcodeSrc ||
      `https://bwipjs-api.metafloor.com/?bcid=code128&text=${rfc}&scale=2&height=10&includetext=false`,
    [barcodeSrc, rfc]
  );

  /* Nombre partido para visualización */
  const [nombreFirst, nombreRest] = useMemo(() => {
    const parts = nombre.split(' ');
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }, [nombre]);

  return (
    <article className="constancia-frame" aria-label="Constancia de Situación Fiscal">
      {/* Franjas decorativas */}
      <div className="constancia-strip constancia-strip--primary" aria-hidden="true" />
      <div className="constancia-strip constancia-strip--secondary" aria-hidden="true" />

      <div className="constancia-body">
        {/* ── Identificación Fiscal ── */}
        <section className="constancia-left" aria-labelledby="identificacion-fiscal">
          <h2 id="identificacion-fiscal" className="constancia-title-sm">
            Cédula de Identificación Fiscal
          </h2>

          <div className="constancia-logos">
            {logosSrc ? (
              <SafeImage
                src={logosSrc}
                alt="Logos de Hacienda y SAT"
                className="constancia-logos-img"
                wrapperClassName="constancia-logos-wrapper"
              />
            ) : (
              <div className="constancia-logos-fallback">
                {/* Logo Hacienda */}
                <svg
                  className="constancia-logo constancia-logo--hacienda"
                  viewBox="0 0 260 60"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Logo Hacienda"
                  role="img"
                >
                  <circle cx="30" cy="30" r="18" className="constancia-logo-hacienda-circle" />
                  <circle cx="30" cy="30" r="14" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="30" cy="30" r="10" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
                  <text x="58" y="36" className="constancia-logo-hacienda-text">
                    Hacienda
                  </text>
                  <text x="58" y="48" className="constancia-logo-hacienda-sub">
                    Secretaría de Hacienda y Crédito Público
                  </text>
                </svg>

                <div className="constancia-logos-divider" aria-hidden="true" />

                {/* Logo SAT */}
                <svg
                  className="constancia-logo constancia-logo--sat"
                  viewBox="0 0 210 60"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Logo SAT"
                  role="img"
                >
                  <g className="constancia-logo-sat-dots">
                    <circle cx="16" cy="20" r="9" />
                    <circle cx="38" cy="20" r="9" />
                    <circle cx="16" cy="42" r="9" />
                    <circle cx="38" cy="42" r="9" />
                  </g>
                  <text x="54" y="36" className="constancia-logo-sat-text">
                    SAT
                  </text>
                  <text x="54" y="48" className="constancia-logo-sat-sub">
                    SERVICIO DE ADMINISTRACIÓN TRIBUTARIA
                  </text>
                </svg>
              </div>
            )}
          </div>

          <div className="constancia-id-section">
            <SafeImage
              src={qrUrl}
              alt={`Código QR de validación para el RFC ${rfc}`}
              className="constancia-qr-img"
              wrapperClassName="constancia-qr"
            />

            <dl className="constancia-data-list">
              <div className="constancia-data-group">
                <dt className="constancia-data-label">Registro Federal de Contribuyentes</dt>
                <dd className="constancia-data-value">{rfc}</dd>
              </div>

              <div className="constancia-data-group">
                <dt className="constancia-data-label">Nombre, denominación o razón social</dt>
                <dd className="constancia-data-value">
                  {nombreFirst}
                  {nombreRest && <span className="constancia-data-value-break">{nombreRest}</span>}
                </dd>
              </div>

              <div className="constancia-data-group">
                <dt className="constancia-data-label">idCIF</dt>
                <dd className="constancia-data-value">{idCif}</dd>
              </div>

              <div className="constancia-data-group">
                <dt className="constancia-data-label">Validación</dt>
                <dd className="constancia-data-value constancia-data-value--uppercase">
                  Valida tu información fiscal
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Detalles de Emisión ── */}
        <section className="constancia-right" aria-labelledby="detalles-emision">
          <h2 id="detalles-emision" className="constancia-title-lg">
            Constancia de Situación Fiscal
          </h2>

          <div className="constancia-emision">
            <span className="constancia-emision-label">Lugar y Fecha de Emisión</span>
            <time className="constancia-emision-value" dateTime={isoDate}>
              {displayLugarFecha}
            </time>
            <p className="constancia-emision-warning">
              * El documento no debe tener más de 3 meses a partir de la fecha de hoy.
            </p>
          </div>

          <div className="constancia-barcode-container">
            <SafeImage
              src={barcodeUrl}
              alt={`Código de barras para el RFC ${rfc}`}
              className="constancia-barcode-img"
              wrapperClassName="constancia-barcode"
            />
            <span className="constancia-barcode-text" aria-hidden="true">
              {rfc}
            </span>
          </div>
        </section>
      </div>

      {/* ── Datos de Identificación del Contribuyente ── */}
      <section className="constancia-section" aria-labelledby="datos-identificacion">
        <h3 id="datos-identificacion" className="constancia-section-title">
          Datos de Identificación del Contribuyente:
        </h3>
        <div className="constancia-section-content">
          <dl className="constancia-row-list">
            <div className="constancia-row">
              <dt className="constancia-label-bold">Estatus en el padrón:</dt>
              <dd className="constancia-value">ACTIVO</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Tabla: Actividades Económicas ── */}
      <section className="constancia-table-section" aria-labelledby="actividades-economicas">
        <div className="constancia-table-header-box">
          <h3 id="actividades-economicas" className="constancia-table-title">
            Actividades Económicas:
          </h3>
        </div>
        <div className="constancia-table-wrapper">
          <table className="constancia-table">
            <thead>
              <tr>
                <th scope="col" className="constancia-table-col constancia-table-col--xs">
                  Orden
                </th>
                <th scope="col" className="constancia-table-col">
                  Actividad Económica
                </th>
                <th scope="col" className="constancia-table-col constancia-table-col--sm">
                  Porcentaje
                </th>
                <th scope="col" className="constancia-table-col constancia-table-col--sm">
                  Fecha Inicio
                </th>
                <th scope="col" className="constancia-table-col constancia-table-col--sm">
                  Fecha Fin
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="constancia-table-cell">1</td>
                <td className="constancia-table-cell">Asalariado</td>
                <td className="constancia-table-cell">100</td>
                <td className="constancia-table-cell">
                  <time dateTime="2014-12-08">08/12/2014</time>
                </td>
                <td className="constancia-table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Tabla: Regímenes ── */}
      <section className="constancia-table-section" aria-labelledby="regimenes">
        <div className="constancia-table-header-box">
          <h3 id="regimenes" className="constancia-table-title">
            Regímenes:
          </h3>
        </div>
        <div className="constancia-table-wrapper">
          <table className="constancia-table">
            <thead>
              <tr>
                <th scope="col" className="constancia-table-col">
                  Régimen
                </th>
                <th scope="col" className="constancia-table-col constancia-table-col--sm">
                  Fecha Inicio
                </th>
                <th scope="col" className="constancia-table-col constancia-table-col--sm">
                  Fecha Fin
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="constancia-table-cell">
                  Régimen de Sueldos y Salarios e Ingresos Asimilados a Salarios
                </td>
                <td className="constancia-table-cell">
                  <time dateTime="2014-12-08">08/12/2014</time>
                </td>
                <td className="constancia-table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
