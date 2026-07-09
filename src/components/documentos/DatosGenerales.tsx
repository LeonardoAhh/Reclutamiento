import React from 'react';
import './DocumentosExternos.css';

export function DatosGenerales() {
  return (
    <div className="documento-imprimible">
      <div className="page-container">
        <header className="page-header">
          <img src="/logo-empresa.jpg" alt="Logo de la empresa" className="logo" />
          <div className="title-wrapper">
            <h1 className="display-title">Datos Generales</h1>
          </div>
        </header>

        <main className="page-main">
          {/* Sección: Identificación y Proceso */}
          <section className="card">
            <div className="card-header">[+] Identificación y Proceso</div>
            
            {/* Nombre completo fila única */}
            <div className="data-row" style={{ marginBottom: 'var(--doc-spacing-sm)' }}>
              <span className="data-label" style={{ width: '20%' }}>Nombre completo:</span>
              <span className="data-value"></span>
            </div>

            <div className="grid-2">
              <div className="grid-cols">
                <div className="data-row"><span className="data-label">Teléfono:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Turno:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Fecha de proceso:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Estado civil:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Edad:</span><span className="data-value"></span></div>
              </div>
              <div className="grid-cols">
                <div className="data-row"><span className="data-label">Puesto:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Ruta:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Parada:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Escolaridad:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Fecha de nacimiento:</span><span className="data-value"></span></div>
              </div>
            </div>
          </section>

          {/* Sección Inferior: 2 Columnas */}
          <div className="grid-2">
            {/* Columna Izquierda: Médico y Familiar */}
            <section className="card">
              <div className="card-header">[+] Familiar, Médico y Emergencia</div>
              <div className="grid-cols">
                <div className="data-row"><span className="data-label">Lugar de nacimiento:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Lugar de residencia:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Hijos:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Género de los hijos:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Fecha nac. hijos:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Tipo de sangre:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Alergias:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Cirugías:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Crédito INFONAVIT:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Crédito FONACOT:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Contacto emergencia:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Parentesco:</span><span className="data-value"></span></div>
                <div className="data-row"><span className="data-label">Teléfono emergencia:</span><span className="data-value"></span></div>
              </div>
            </section>

            {/* Columna Derecha: Reclutamiento, Uniforme, Banco */}
            <div className="grid-cols">
              <section className="card">
                <div className="card-header">[+] Reclutamiento</div>
                <div className="grid-cols">
                  <div className="data-row"><span className="data-label">Correo electrónico:</span><span className="data-value"></span></div>
                  <div className="data-row"><span className="data-label">¿Cómo se enteró?</span><span className="data-value"></span></div>
                  <div className="data-row"><span className="data-label">Reclutador:</span><span className="data-value"></span></div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">[+] Uniforme y calzado</div>
                <div className="grid-cols">
                  <div className="data-row"><span className="data-label">Playera:</span><span className="data-value"></span></div>
                  <div className="data-row"><span className="data-label">Calzado:</span><span className="data-value"></span></div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">[+] Cuenta bancaria</div>
                <div className="grid-cols">
                  <div className="data-row"><span className="data-label">BanBajío:</span><span className="data-value" style={{ borderBottom: 'none' }}><span className="ascii-toggle">[ ] Sí &nbsp; [ ] No</span></span></div>
                  <div className="data-row"><span className="data-label">BanRegio:</span><span className="data-value" style={{ borderBottom: 'none' }}><span className="ascii-toggle">[ ] Sí &nbsp; [ ] No</span></span></div>
                  <div className="data-row" style={{ borderBottom: 'none', marginTop: '6pt' }}>
                    <span className="data-label" style={{ width: '100%' }}>¿Tiene adeudos con alguno de estos?</span>
                  </div>
                  <div className="data-row" style={{ paddingTop: 0 }}>
                    <span className="data-value" style={{ textAlign: 'center', borderBottom: 'none' }}><span className="ascii-toggle">[ ] Sí &nbsp; [ ] No</span></span>
                  </div>
                </div>
              </section>
            </div>
          </div>
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
