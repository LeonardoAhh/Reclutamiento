import { CalendarCheck } from 'lucide-react';
import { Modal } from './Modal';
import type { Candidate } from '@/lib/types';
import './CandidatesCitedTodayModal.css';

interface CandidatesCitedTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

function groupByArea(candidates: Candidate[]) {
  const map = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const area = (c.area ?? '').trim() || '—';
    const arr = map.get(area) ?? [];
    arr.push(c);
    map.set(area, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function CandidatesCitedTodayModal({
  isOpen,
  onClose,
  candidates,
}: CandidatesCitedTodayModalProps) {
  const grouped = groupByArea(candidates);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidates-cited-today-modal modal-fullscreen-mobile"
      icon={<CalendarCheck size={20} aria-hidden="true" />}
      title="Citados hoy"
      subtitle="Detalle de candidatos citados"
    >
      <div className="modal-body candidates-cited-today-modal__body">
        <header className="candidates-cited-today-modal__summary">
          <div className="candidates-cited-today-modal__big-number">
            {candidates.length}
          </div>
          <p className="candidates-cited-today-modal__big-label">
            {candidates.length === 1 ? 'candidato citado' : 'candidatos citados'}
          </p>
        </header>

        {candidates.length === 0 ? (
          <p className="candidates-cited-today-modal__empty">
            No hay candidatos citados hoy.
          </p>
        ) : (
          <div className="candidates-cited-today-modal__groups">
            {grouped.map(([area, items]) => (
              <section
                key={area}
                className="candidates-cited-today-modal__area"
                aria-label={`Área ${area}`}
              >
                <h3 className="candidates-cited-today-modal__area-title">
                  {area} <span className="candidates-cited-today-modal__area-count">({items.length})</span>
                </h3>
                <ul className="candidates-cited-today-modal__list">
                  {items.map((c) => (
                    <li key={c.id ?? c.nombre} className="candidates-cited-today-modal__item">
                      <div className="candidates-cited-today-modal__main">
                        <span className="candidates-cited-today-modal__name">{c.nombre}</span>
                        <span className="candidates-cited-today-modal__puesto">{c.puesto}</span>
                        <span className="candidates-cited-today-modal__seccion">{c.seccion ?? '—'}</span>
                      </div>
                      <div className="candidates-cited-today-modal__meta">
                        <span className="candidates-cited-today-modal__reclutador">{c.reclutador ?? '—'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
