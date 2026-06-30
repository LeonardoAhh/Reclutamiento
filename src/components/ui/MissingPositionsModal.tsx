import { useMemo, useState, useEffect } from 'react';
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

interface MissingRow {
  pos: PositionCoverage;
  netPlantilla: number;
  netBackup: number;
  netTotal: number;
  proximos: number;
}

/**
 * Descuenta los próximos ingresos (empleados ya dados de alta con fecha de
 * ingreso futura) de las vacantes: primero cubren la plantilla autorizada y
 * el remanente el buffer de backup. Así el reporte refleja YA cuánto bajará la
 * necesidad sin esperar a la fecha de ingreso.
 */
function netVacancies(pos: PositionCoverage): MissingRow {
  const rawPlantilla = Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
  const rawBackup = Math.max(
    0,
    pos.plantilla_objetivo - Math.max(pos.plantilla_real, pos.plantilla_autorizada)
  );
  const proximos = pos.proximos_ingresos;

  const netPlantilla = Math.max(0, rawPlantilla - proximos);
  const remaining = Math.max(0, proximos - rawPlantilla);
  const netBackup = Math.max(0, rawBackup - remaining);

  return { pos, netPlantilla, netBackup, netTotal: netPlantilla + netBackup, proximos };
}

export function MissingPositionsModal({
  isOpen,
  onClose,
  coverage,
  candidates,
}: MissingPositionsModalProps) {

  // Estado de filas "bloureadas" (excluidas del conteo)
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  // Resetear al cerrar el modal
  useEffect(() => {
    if (!isOpen) setDismissedKeys(new Set());
  }, [isOpen]);

  const toggleDismiss = (key: string) => {
    setDismissedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 1. Memoizamos la lista filtrada y ordenada para evitar recalcular en cada render
  const missingPositions = useMemo(() => {
    return coverage
      .map(netVacancies)
      .filter((r) => r.netTotal > 0)
      .sort((a, b) =>
        a.pos.area.localeCompare(b.pos.area) ||
        (a.pos.seccion || '').localeCompare(b.pos.seccion || '') ||
        a.pos.puesto.localeCompare(b.pos.puesto)
      );
  }, [coverage]);

  // 2. Totales recalculados excluyendo filas bloureadas
  const { totalFaltanPlantilla, totalFaltanBackup } = useMemo(() => {
    let faltanPlantilla = 0;
    let faltanBackup = 0;
    missingPositions.forEach((r) => {
      const key = `${r.pos.area}-${r.pos.seccion || 'none'}-${r.pos.puesto}`;
      if (!dismissedKeys.has(key)) {
        faltanPlantilla += r.netPlantilla;
        faltanBackup += r.netBackup;
      }
    });
    return { totalFaltanPlantilla: faltanPlantilla, totalFaltanBackup: faltanBackup };
  }, [missingPositions, dismissedKeys]);

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
                  {missingPositions.map((r) => {
                    const pos = r.pos;
                    const processKey = buildPositionKey(pos.puesto, pos.seccion || '');
                    const processes = processStatsMap[processKey] || { candidates: 0 };
                    const totalProcesses = processes.candidates;

                    const faltanPlantilla = r.netPlantilla;
                    const faltanBackup = r.netBackup;

                    const rowKey = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;
                    const isDismissed = dismissedKeys.has(rowKey);

                    return (
                      <tr
                        key={rowKey}
                        className={isDismissed ? 'is-dismissed' : ''}
                        onClick={() => toggleDismiss(rowKey)}
                        title={isDismissed ? 'Click para incluir de nuevo en el conteo' : 'Click para excluir del conteo'}
                        aria-pressed={isDismissed}
                      >
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
                          {r.proximos > 0 && (
                            <span
                              className="missing-positions-modal__puesto-note"
                              title="Vacantes ya cubiertas por empleados con fecha de ingreso futura, descontadas del total."
                            >
                              −{r.proximos} próx. ingreso{r.proximos === 1 ? '' : 's'} descontado{r.proximos === 1 ? '' : 's'}
                            </span>
                          )}
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
                            {r.netTotal}
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
