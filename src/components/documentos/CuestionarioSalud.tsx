import React from 'react';
import './DocumentosExternos.css';

export function CuestionarioSalud() {
  return (
    <div className="documento-imprimible">
      <div className="page-container">
        <header className="page-header">
          <img src="/logo-empresa.jpg" alt="Logo de la empresa" className="logo" />
          <div className="title-wrapper">
            <h1 className="display-title">CUESTIONARIO DE SALUD</h1>
          </div>
        </header>

        <main className="page-main">
          {/* Aviso Superior */}
          <div className="declaration" style={{ textAlign: 'center', marginBottom: 0 }}>
            El presente cuestionario tiene la finalidad de contar con toda la información relacionada con tu salud y será utilizada unicamente para fines estadísticos. Es importante que la información que manifiestes en éste documento sea verídica a fin de prevenir algún riesgo y contar con tu historial médico en caso de ser necesario.
          </div>

          {/* Cuestionario */}
          <section className="card">
            <div className="card-header">[+] Historial Médico</div>
            <div className="grid-cols" style={{ gap: 'var(--doc-spacing-sm)' }}>

              {/* 1 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>1. ¿Padeces o has padecido alguna enfermedad crónica? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Especifique:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 2 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>2. ¿Has sufrido algún accidente de gravedad? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Especifique:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 3 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>3. ¿Has tenido alguna cirugía? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Especifique:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 4 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%', marginBottom: '4pt' }}>4. Has sufrido de:
                  <span className="ascii-toggle">[ ] Fractura</span>
                  <span className="ascii-toggle">[ ] Esguince</span>
                  <span className="ascii-toggle">[ ] Luxación</span>
                  <span className="ascii-toggle">[ ] Torcedura grave</span>
                </span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Hace cuánto tiempo:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 5 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>5. ¿Consumes bebidas alcoholicas? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>¿Con qué frecuencia?</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 6 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>6. ¿Fumas? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>¿Cuántos cigarros al día?</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 7 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>7. ¿Tienes alguna alergia? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Especifica:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 8 */}
              <div className="data-row">
                <span className="data-label" style={{ width: '100%' }}>8. Esta usted embarazada? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
              </div>

              {/* 9 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>9. ¿Practicas algún deporte? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>Especifique:</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 10 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>10. ¿Usas lentes? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>¿Cuándo fue la última vez que cambió sus lentes?</span>
                  <span className="data-value"></span>
                </div>
              </div>

              {/* 11 */}
              <div className="data-row" style={{ flexWrap: 'wrap' }}>
                <span className="data-label" style={{ width: '100%' }}>11. ¿Estas dispuesto (a) a realizarte antidoping? <span className="ascii-toggle" style={{ float: 'right' }}>[ ] Sí &nbsp; [ ] No</span></span>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', marginTop: '4pt' }}>
                  <span className="data-label" style={{ width: 'auto', marginRight: 'var(--doc-spacing-xs)' }}>¿Porqué?</span>
                  <span className="data-value"></span>
                </div>
              </div>

            </div>
          </section>
        </main>

        <footer className="page-footer">
          <div className="declaration">
            El solicitante manifiesta bajo <strong>protesta de decir verdad</strong>, que todos los datos mencionados en este formato son verídicos. En caso de que el solicitante sea contratado por esta compañía y los datos declarados resulten falsos, la empresa queda autorizada para solicitar la renuncia del empleado sin obligación de indemnización alguna.
          </div>

          <div className="signature-container">
            <div className="signature-block">
              <div className="signature-line"></div>
              <div className="signature-label">Nombre completo, fecha, firma</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
