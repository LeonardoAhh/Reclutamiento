import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, Star } from 'lucide-react';
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
  starlite: number;
}

interface MissingRow {
  pos: PositionCoverage;
  netPlantilla: number;
  netBackup: number;
  netStarlite: number;
  netTotal: number;
  proximos: number;
  proxPlantilla: number;
  proxBackup: number;
  proxExcedente: number;
}

/**
 * Descuenta los próximos ingresos (empleados ya dados de alta con fecha de
 * ingreso futura) de las vacantes: primero cubren la plantilla autorizada y
 * el remanente el buffer de backup. Así el reporte refleja YA cuánto bajará la
 * necesidad sin esperar a la fecha de ingreso.
 */
function netVacancies(pos: PositionCoverage): MissingRow {
  // Las vacantes netas ya vienen calculadas desde utils.ts (considerando proximos ingresos)
  const netPlantilla = pos.vacantes_plantilla;
  const netBackup = pos.vacantes_backup;
  const netStarlite = pos.vacantes_starlite;
  
  const netTotal = netPlantilla + netBackup + netStarlite;
  const proximos = pos.proximos_ingresos;

  // Para el desglose visual de a dónde se fueron los "próximos ingresos":
  // Calculamos cómo estaban las vacantes ANTES de los próximos ingresos,
  // y vemos la diferencia con las vacantes actuales.
  
  const urgentes = pos.urgentes ?? 0;
  const backup = pos.backup ?? 0;
  
  // Vacantes previas de Starlite
  const vacantesStarlitePrev = Math.max(0, urgentes - pos.starlite_empleados);
  const proxStarlite = vacantesStarlitePrev - netStarlite;
  const starliteSpilloverPrev = Math.max(0, pos.starlite_empleados - urgentes);

  const disponiblesPrev = pos.plantilla_real - pos.starlite_empleados + starliteSpilloverPrev;
  
  const vacantesPlantillaPrev = Math.max(0, pos.plantilla_autorizada - disponiblesPrev);
  const vacantesBackupPrev = Math.max(0, backup - Math.max(0, disponiblesPrev - pos.plantilla_autorizada));
  
  const proxPlantilla = vacantesPlantillaPrev - netPlantilla;
  const proxBackup = vacantesBackupPrev - netBackup;
  const proxExcedente = proximos - proxStarlite - proxPlantilla - proxBackup;

  return { 
    pos, 
    netPlantilla, 
    netBackup,
    netStarlite,
    netTotal, 
    proximos,
    proxPlantilla,
    proxBackup,
    proxExcedente
  };
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
      if (!stats[key]) stats[key] = { candidates: 0, starlite: 0 };
      stats[key].candidates += 1;
      if (c.is_starlite) stats[key].starlite += 1;
    });

    return stats;
  }, [candidates]);

  // 3. Totales recalculados excluyendo filas bloureadas
  const { totalFaltanPlantilla, totalFaltanBackup, totalStarlite } = useMemo(() => {
    let faltanPlantilla = 0;
    let faltanBackup = 0;
    let starlite = 0;
    missingPositions.forEach((r) => {
      const key = `${r.pos.area}-${r.pos.seccion || 'none'}-${r.pos.puesto}`;
      if (!dismissedKeys.has(key)) {
        faltanPlantilla += r.netPlantilla;
        faltanBackup += r.netBackup;
        starlite += r.netStarlite;
      }
    });
    return { totalFaltanPlantilla: faltanPlantilla, totalFaltanBackup: faltanBackup, totalStarlite: starlite };
  }, [missingPositions, dismissedKeys]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="missing-positions-modal"
      icon={<AlertCircle size={20} aria-hidden="true" />}
      title="Vacantes y Procesos"
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
              PLANTILLA
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
                  {totalFaltanBackup}
                </span>
                <span className="missing-positions-modal__summary-label">
                  BACKUP
                </span>
              </div>
            </>
          )}

          {totalStarlite > 0 && (
            <>
              <div className="missing-positions-modal__summary-divider" aria-hidden="true" />
              <div
                className="missing-positions-modal__summary-item missing-positions-modal__summary-item--starlite"
                data-testid="summary-starlite"
              >
                <span className="missing-positions-modal__summary-value">
                  {totalStarlite}
                </span>
                <span className="missing-positions-modal__summary-label">
                  <Star size={12} className="missing-positions-modal__starlite-icon" style={{ display: 'inline-block', marginRight: '4px' }} aria-hidden="true" />
                  STARLITE
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
          >


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
                      className="missing-positions-modal__num-col missing-positions-modal__starlite-col"
                      title="Vacantes del programa Starlite"
                    >
                      <Star size={12} className="missing-positions-modal__starlite-icon" aria-hidden="true" style={{ marginRight: '2px' }} />
                      Starlite
                    </th>
                    <th
                      scope="col"
                      className="missing-positions-modal__num-col"
                    >
                      Total
                    </th>
                    <th scope="col" className="missing-positions-modal__tight-col">Procesos activos</th>
                  </tr>
                </thead>
                <tbody>
                  {missingPositions.map((r) => {
                    const pos = r.pos;
                    const processKey = buildPositionKey(pos.puesto, pos.seccion || '');
                    const processes = processStatsMap[processKey] || { candidates: 0, starlite: 0 };
                    const totalProcesses = processes.candidates;
                    const starliteCount = r.pos.starlite_empleados + r.pos.starlite_proximos;

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
                            <div className="missing-positions-modal__prox-details">
                              <span
                                className="missing-positions-modal__puesto-note"
                                title="Vacantes ya cubiertas por empleados con fecha de ingreso futura, descontadas del total."
                              >
                                −{r.proximos} PRÓX. INGRESO{r.proximos === 1 ? '' : 'S'}
                              </span>
                              {(() => {
                                const starliteDisp = pos.starlite_proximos;
                                const regularDisp = Math.max(0, r.proximos - starliteDisp);
                                
                                const plantillaDisp = Math.min(r.proxPlantilla, regularDisp);
                                const backupDisp = Math.min(r.proxBackup, regularDisp - plantillaDisp);
                                const excedenteDisp = Math.min(r.proxExcedente, regularDisp - plantillaDisp - backupDisp);

                                return (
                                  <span className="missing-positions-modal__prox-breakdown" style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block', marginTop: '2px' }}>
                                    (
                                    {[
                                      starliteDisp > 0 ? `★ ${starliteDisp} Starlite` : null,
                                      plantillaDisp > 0 ? `${plantillaDisp} Plantilla` : null,
                                      backupDisp > 0 ? `${backupDisp} Backup` : null,
                                      excedenteDisp > 0 ? `${excedenteDisp} Excedente` : null,
                                    ].filter(Boolean).join(', ')}
                                    )
                                  </span>
                                );
                              })()}
                            </div>
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
                          {r.netStarlite > 0 ? (
                            <span className="missing-positions-modal__count-badge" style={{ color: '#d97706', fontWeight: 600 }}>
                              {r.netStarlite}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty" aria-label="Sin faltantes en starlite">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__num-col">
                          <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--total">
                            {r.netTotal}
                          </span>
                        </td>
                        <td className="missing-positions-modal__tight-col">
                          {totalProcesses > 0 ? (
                            <span className="missing-positions-modal__processes-pill">
                              <span className="missing-positions-modal__processes-dot" aria-hidden="true" />
                              {totalProcesses}
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
