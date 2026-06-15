import { Activity } from 'lucide-react';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Candidate } from '@/lib/types';
import './CandidatesInProcessModal.css';

interface CandidatesInProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

interface PuestoSeccionCount {
  puesto: string;
  seccion: string;
  count: number;
}

function groupByPuestoSeccion(candidates: Candidate[]): PuestoSeccionCount[] {
  const map = new Map<string, PuestoSeccionCount>();
  for (const c of candidates) {
    const puesto = (c.puesto ?? '').trim() || '—';
    const seccion = (c.seccion ?? '').trim() || '—';
    const key = `${puesto}||${seccion}`;
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, { puesto, seccion, count: 1 });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.count - a.count ||
      a.puesto.localeCompare(b.puesto) ||
      a.seccion.localeCompare(b.seccion)
  );
}

export function CandidatesInProcessModal({
  isOpen,
  onClose,
  candidates,
}: CandidatesInProcessModalProps) {
  const isMobile = useIsMobile();
  const grouped = groupByPuestoSeccion(candidates);

  const renderList = () => (
    <ul className="candidates-in-process-modal__puesto-list">
      {grouped.map((g) => (
        <li
          key={`${g.puesto}||${g.seccion}`}
          className="candidates-in-process-modal__puesto-item"
        >
          <span className="candidates-in-process-modal__puesto-name">
            {g.puesto}
          </span>
          <span className="candidates-in-process-modal__puesto-seccion">
            {g.seccion}
          </span>
          <span className="candidates-in-process-modal__puesto-count">
            {g.count}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidates-in-process-modal modal-fullscreen-mobile"
      icon={<Activity size={20} aria-hidden="true" />}
      title="Candidatos en proceso"
      subtitle="Activos en página de candidatos"
      size={isMobile ? 'md' : 'lg'}
    >
      <div className="modal-body candidates-in-process-modal__body">
        <header className="candidates-in-process-modal__summary">
          <div className="candidates-in-process-modal__big-number">
            {candidates.length}
          </div>
          <p className="candidates-in-process-modal__big-label">
            {candidates.length === 1 ? 'Proceso' : 'Procesos'}
          </p>
        </header>

        {candidates.length === 0 ? (
          <p className="candidates-in-process-modal__empty">
            No hay candidatos en proceso.
          </p>
        ) : isMobile ? (
          <ExpandableSection
            title="Puestos con procesos"
            badge={`${grouped.length} puestos`}
            variant="card"
            defaultExpanded
          >
            {renderList()}
          </ExpandableSection>
        ) : (
          <section
            className="candidates-in-process-modal__section"
            aria-label="Resumen por puesto y sección"
          >
            <h3 className="candidates-in-process-modal__section-title">
              Puestos con procesos  
            </h3>
            {renderList()}
          </section>
        )}
      </div>
    </Modal>
  );
}
