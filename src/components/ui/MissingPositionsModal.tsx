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

export function MissingPositionsModal({
  isOpen,
  onClose,
  coverage,
  vacancies,
  candidates,
}: MissingPositionsModalProps) {
  // Puestos que hacen falta (donde hay vacantes según el cálculo de cobertura)
  const missingPositions = coverage
    .filter((pos) => pos.vacantes > 0)
    .sort((a, b) => 
      a.area.localeCompare(b.area) || 
      (a.seccion || '').localeCompare(b.seccion || '') || 
      a.puesto.localeCompare(b.puesto)
    );

  // Procesos activos (vacantes abiertas + candidatos en proceso)
  const activeVacancies = vacancies.filter(
    (v) => v.status === 'abierta' || v.status === 'en_proceso' || v.status === 'pausa'
  );
  
  const getActiveProcessesCount = (puesto: string) => {
    // Para simplificar, contamos las requisiciones (vacancies) para este puesto
    // y los candidatos en proceso para este puesto.
    const vCount = activeVacancies.filter(
      (v) => v.puesto.trim().toLowerCase() === puesto.trim().toLowerCase()
    ).length;
    const cCount = candidates.filter(
      (c) => (c.puesto || '').trim().toLowerCase() === puesto.trim().toLowerCase()
    ).length;
    
    return { vacancies: vCount, candidates: cCount };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="missing-positions-modal modal-fullscreen-mobile"
      icon={<AlertCircle size={20} aria-hidden="true" />}
      title="Detalle de Vacantes y Procesos"
      subtitle="Puestos con falta de cobertura y sus procesos activos"
    >
      <div className="modal-body missing-positions-modal__body">
        <header className="missing-positions-modal__summary">
          <div className="missing-positions-modal__big-number">
            {missingPositions.reduce((sum, p) => sum + p.vacantes, 0)}
          </div>
          <p className="missing-positions-modal__big-label">
            Vacantes Totales
          </p>
        </header>

        {missingPositions.length === 0 ? (
          <p className="missing-positions-modal__empty">
            Excelente, no hay puestos con falta de cobertura.
          </p>
        ) : (
          <section
            className="missing-positions-modal__section"
            aria-label="Resumen de puestos faltantes"
          >
            <h3 className="missing-positions-modal__section-title">
              Puestos que hacen falta
            </h3>
            <div className="missing-positions-modal__table-container">
              <table className="missing-positions-modal__table">
                <thead>
                  <tr>
                    <th>Área</th>
                    <th>Sección</th>
                    <th>Puesto</th>
                    <th>Faltan Plantilla</th>
                    <th>Faltan Backup</th>
                    <th>Total Faltan</th>
                    <th>Procesos Activos</th>
                  </tr>
                </thead>
                <tbody>
                  {missingPositions.map((pos) => {
                    const processes = getActiveProcessesCount(pos.puesto);
                    const totalProcesses = processes.vacancies + processes.candidates;
                    
                    const faltanPlantilla = Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
                    const faltanBackup = Math.max(0, pos.plantilla_objetivo - Math.max(pos.plantilla_real, pos.plantilla_autorizada));
                    
                    return (
                      <tr key={`${pos.puesto}||${pos.seccion}||${pos.area}`}>
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
                            <span className="missing-positions-modal__count-empty">—</span>
                          )}
                        </td>
                        <td className="missing-positions-modal__vacantes-cell">
                          {faltanBackup > 0 ? (
                            <span className="missing-positions-modal__count-badge missing-positions-modal__count-badge--warning">
                              {faltanBackup}
                            </span>
                          ) : (
                            <span className="missing-positions-modal__count-empty">—</span>
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
                              {processes.vacancies > 0 && (
                                <Badge variant="teal">
                                  {processes.vacancies} Requisicion{processes.vacancies !== 1 ? 'es' : ''}
                                </Badge>
                              )}
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
