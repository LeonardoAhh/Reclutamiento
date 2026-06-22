import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import type { PositionCoverage, VacancyRequest, Candidate } from '@/lib/types';
import './MissingPositionsModal.css';

/**
 * Normalización robusta para hacer match entre candidato y posición:
 *  - lowercase
 *  - quita acentos/diacríticos (NFD + strip de marcas combinantes)
 *  - reemplaza cualquier carácter no alfanumérico por espacio
 *  - colapsa espacios múltiples y recorta
 *
 * Esto evita que diferencias como "1ER. TURNO" vs "1ER TURNO",
 * "PRODUCCIÓN" vs "PRODUCCION", caracteres NBSP invisibles, u otras
 * variaciones de captura rompan el cruce de datos.
 */
function normalizeForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Clave para cruzar candidato ↔ posición. Match estricto por
 * `puesto + sección` ya normalizados — un candidato debe coincidir
 * exactamente con la posición/turno que va a ocupar.
 */
function buildPositionKey(puesto: string, seccion: string): string {
  return `${normalizeForMatch(puesto)}||${normalizeForMatch(seccion)}`;
}

interface MissingPositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: PositionCoverage[];
  vacancies: VacancyRequest[];
  candidates: Candidate[];
}

// Interfaz interna para el diccionario de procesos
interface ProcessStats {
  candidates: number;
}

export function MissingPositionsModal({
  isOpen,
  onClose,
  coverage,
  candidates,
}: MissingPositionsModalProps) {

  // 1. Memoizamos la lista filtrada y ordenada para evitar recalcular en cada render
  const { missingPositions, totalFaltanPlantilla, totalFaltanBackup } = useMemo(() => {
    let faltanPlantilla = 0;
    let faltanBackup = 0;

    const filtered = coverage
      .filter((pos) => pos.vacantes > 0)
      .sort((a, b) =>
        a.area.localeCompare(b.area) ||
        (a.seccion || '').localeCompare(b.seccion || '') ||
        a.puesto.localeCompare(b.puesto)
      );

    filtered.forEach((pos) => {
      faltanPlantilla += Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
      faltanBackup += Math.max(0, pos.plantilla_objetivo - Math.max(pos.plantilla_real, pos.plantilla_autorizada));
    });

    return {
      missingPositions: filtered,
      totalFaltanPlantilla: faltanPlantilla,
      totalFaltanBackup: faltanBackup
    };
  }, [coverage]);

  // 2. Creamos un diccionario (Hash Map) de procesos activos (O(1) lookup)
  const processStatsMap = useMemo(() => {
    const stats: Record<string, ProcessStats> = {};

    // Estados que cuentan como "proceso activo": aún en pipeline trabajando
    // hacia la contratación. Excluye terminales (contratado, rechazado,
    // no_asistio) que ya no son procesos abiertos.
    const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
      'entrevista',
      'entrega_documentos',
      'faltan_documentos',
      'feedback_pendiente',
    ]);

    candidates.forEach((c) => {
      if (!ACTIVE_STATUSES.has(c.status)) return;
      const key = buildPositionKey(c.puesto, c.seccion || '');
      if (!stats[key]) stats[key] = { candidates: 0 };
      stats[key].candidates += 1;
    });

    return stats;
  }, [candidates]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="missing-positions-modal"
      icon={<AlertCircle size={20} aria-hidden="true" />}
      title="Detalle de Vacantes y Procesos"
      fullscreenMobile={true}
    >
      <div className="modal-body missing-positions-modal__body">

        {/* Encabezado de Totales */}
        <header
          className="missing-positions-modal__summary"
          aria-label="Resumen de vacantes pendientes"
        >
          <div
            className="missing-positions-modal__summary-item missing-positions-modal__summary-item--error"
            data-testid="summary-plantilla"
          >
            <span className="missing-positions-modal__summary-value">
              {totalFaltanPlantilla}
            </span>
            <span className="missing-positions-modal__summary-label">
              Vacantes Plantilla
            </span>
          </div>

          {totalFaltanBackup > 0 && (
            <>
              <div className="missing-positions-modal__summary-divider" aria-hidden="true" />
              <div
                className="missing-positions-modal__summary-item missing-positions-modal__summary-item--warning"
                data-testid="summary-backup"
              >
                <span className="missing-positions-modal__summary-value">
                  +{totalFaltanBackup}
                </span>
                <span className="missing-positions-modal__summary-label">
                  Vacantes Backup
                </span>
              </div>
            </>
          )}
        </header>

        {/* Contenido Principal */}
        {missingPositions.length === 0 ? (
          <p className="missing-positions-modal__empty">
            Excelente, no hay puestos con falta de cobertura.
          </p>
        ) : (
          <section
            className="missing-positions-modal__section"
            aria-labelledby="missing-positions-title"
          >
            <h3 id="missing-positions-title" className="missing-positions-modal__section-title">
              Puestos que hacen falta
            </h3>

            {/* Contenedor con tabIndex para permitir scroll con teclado (Accesibilidad) */}
            <div
              className="missing-positions-modal__table-container"
              tabIndex={0}
              role="region"
              aria-label="Tabla de puestos faltantes"
            >
              <table className="missing-positions-modal__table">
                <thead>
                  <tr>
                    <th scope="col">Área / Sección</th>
                    <th scope="col">Puesto</th>
                    <th
                      scope="col"
                      className="missing-positions-modal__num-col"
                      title="Vacantes en plantilla autorizada"
                    >
                      Plantilla
                    </th>
                    <th
                      scope="col"
                      className="missing-positions-modal__num-col"
                      title="Vacantes en buffer de backup"
                    >
                      Backup
                    </th>
                    <th
                      scope="col"
                      className="missing-positions-modal__num-col"
                    >
                      Total
                    </th>
                    <th scope="col">Procesos activos</th>
                  </tr>
                </thead>
                <tbody>
                  {missingPositions.map((pos) => {
                    const processKey = buildPositionKey(pos.puesto, pos.seccion || '');
                    const processes = processStatsMap[processKey] || { candidates: 0 };
                    const totalProcesses = processes.candidates;

                    const faltanPlantilla = Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
                    const faltanBackup = Math.max(0, pos.plantilla_objetivo - Math.max(pos.plantilla_real, pos.plantilla_autorizada));

                    const rowKey = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;

                    return (
                      <tr key={rowKey}>
                        <td>
                          <div className="missing-positions-modal__loc">
                            <span className="missing-positions-modal__loc-area">
                              {pos.area}
                            </span>
                            {pos.seccion && (
                              <span className="missing-positions-modal__loc-seccion">
                                {pos.seccion}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="missing-positions-modal__puesto-name">
                            {pos.puesto}
                          </span>
                        </td>
                        <td className="missing-positions-modal__num-col">
                          {faltanPlantilla > 0 ? (
                            <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--error">
                              {faltanPlantilla}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty" aria-label="Sin faltantes en plantilla">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__num-col">
                          {faltanBackup > 0 ? (
                            <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--warning">
                              {faltanBackup}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty" aria-label="Sin faltantes en backup">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__num-col">
                          <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--total">
                            {pos.vacantes}
                          </span>
                        </td>
                        <td>
                          {totalProcesses > 0 ? (
                            <span className="missing-positions-modal__processes-pill">
                              <span className="missing-positions-modal__processes-dot" aria-hidden="true" />
                              {totalProcesses} candidato{totalProcesses !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span
                              className="missing-positions-modal__count-empty"
                              aria-label="Sin procesos activos"
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
