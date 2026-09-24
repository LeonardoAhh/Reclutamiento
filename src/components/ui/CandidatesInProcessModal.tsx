import { Activity, CircleCheckBig } from 'lucide-react';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { StarliteBadge } from './Badge';
import './CandidatesInProcessModal.css';

interface CandidatesInProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

interface PuestoCount {
  puesto: string;
  isStarlite: boolean;
  count: number;
  statuses: Partial<Record<CandidateStatus, number>>;
}

function groupByPuesto(candidates: Candidate[]): PuestoCount[] {
  const map = new Map<string, PuestoCount>();
  for (const c of candidates) {
    const puesto = (c.puesto ?? '').trim() || '—';
    const isStarlite = !!c.is_starlite;
    const key = `${puesto}||${isStarlite}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { puesto, isStarlite, count: 0, statuses: {} };
      map.set(key, entry);
    }
    entry.count += 1;
    entry.statuses[c.status] = (entry.statuses[c.status] || 0) + 1;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.puesto.localeCompare(b.puesto)
  );
}

export function CandidatesInProcessModal({
  isOpen,
  onClose,
  candidates,
}: CandidatesInProcessModalProps) {
  const isMobile = useIsMobile();
  const grouped = groupByPuesto(candidates);

  const renderList = () => (
    <ul className="candidates-in-process-modal__puesto-list">
      {grouped.map((g) => (
        <li
          key={`${g.puesto}||${g.isStarlite}`}
          className="candidates-in-process-modal__puesto-item"
        >
          <div className="candidates-in-process-modal__puesto-main">
            <div className="candidates-in-process-modal__puesto-header">
              <span className="candidates-in-process-modal__puesto-name">
                {g.puesto}
                {g.isStarlite && (
                  <span style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                    <StarliteBadge compact />
                  </span>
                )}
              </span>
            </div>
            <div className="candidates-in-process-modal__puesto-badges">
              {Object.entries(g.statuses)
                // sort by count desc so most common status is first
                .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
                .map(([status, count]) => (
                  <CandidateStatusBadge
                    key={status}
                    status={status as CandidateStatus}
                    count={count as number}
                  />
                ))}
            </div>
          </div>
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
      className="candidates-in-process-modal"
      icon={<Activity size={20} aria-hidden="true" />}
      title="Procesos por cerrar"
      size="sm"
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
