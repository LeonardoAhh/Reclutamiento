import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import type { PositionCoverage, VacancyRequest, Candidate } from '@/lib/types';
import './MissingPositionsModal.css';

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

    const normalizeKey = (p: string, s: string) => {
      const puesto = (p || '').trim().toLowerCase();
      const seccion = (s || '').trim().toLowerCase();
      return `${puesto}||${seccion}`;
    };

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
      const key = normalizeKey(c.puesto, c.seccion || '');
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
        <header className="missing-positions-modal__summary">
          <div className="missing-positions-modal__summary-group">
            <div className="missing-positions-modal__big-number">
              {totalFaltanPlantilla}
            </div>
            <p className="missing-positions-modal__big-label">
              Vacantes Plantilla
            </p>
          </div>

          {totalFaltanBackup > 0 && (
            <>
              <div className="missing-positions-modal__summary-divider" aria-hidden="true" />
              <div className="missing-positions-modal__summary-group">
                <span className="missing-positions-modal__backup-number">
                  +{totalFaltanBackup}
                </span>
                <span className="missing-positions-modal__backup-label">
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
                    <th scope="col">Área</th>
                    <th scope="col">Sección</th>
                    <th scope="col">Puesto</th>
                    <th scope="col" className="missing-positions-modal__vacantes-cell">Faltan Plantilla</th>
                    <th scope="col" className="missing-positions-modal__vacantes-cell">Faltan Backup</th>
                    <th scope="col" className="missing-positions-modal__vacantes-cell">Total Faltan</th>
                    <th scope="col">Procesos Activos</th>
                  </tr>
                </thead>
                <tbody>
                  {missingPositions.map((pos) => {
                    const normalizedPuesto = (pos.puesto || '').trim().toLowerCase();
                    const normalizedSeccion = (pos.seccion || '').trim().toLowerCase();
                    const processKey = `${normalizedPuesto}||${normalizedSeccion}`;
                    const processes = processStatsMap[processKey] || { candidates: 0 };
                    const totalProcesses = processes.candidates;

                    const faltanPlantilla = Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
                    const faltanBackup = Math.max(0, pos.plantilla_objetivo - Math.max(pos.plantilla_real, pos.plantilla_autorizada));

                    // Clave optimizada y robusta
                    const rowKey = `${pos.area}-${pos.seccion || 'none'}-${pos.puesto}`;

                    return (
                      <tr key={rowKey}>
                        <td>
                          <span className="missing-positions-modal__puesto-area">
                            {pos.area}
                          </span>
                        </td>
                        <td>
                          <span className="missing-positions-modal__puesto-seccion">
                            {pos.seccion || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="missing-positions-modal__puesto-name">
                            {pos.puesto}
                          </span>
                        </td>
                        <td className="missing-positions-modal__vacantes-cell">
                          {faltanPlantilla > 0 ? (
                            <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--error">
                              {faltanPlantilla}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty" aria-label="Cero faltantes en plantilla">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__vacantes-cell">
                          {faltanBackup > 0 ? (
                            <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--warning">
                              {faltanBackup}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty" aria-label="Cero faltantes en backup">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__vacantes-cell">
                          <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--total">
                            {pos.vacantes}
                          </span>
                        </td>
                        <td>
                          {totalProcesses > 0 ? (
                            <div className="missing-positions-modal__processes">
                              {processes.candidates > 0 && (
                                <Badge variant="success">
                                  {processes.candidates} Candidato{processes.candidates !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="missing-positions-modal__no-processes">
                              Sin procesos
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
