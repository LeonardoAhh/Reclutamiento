import { CalendarCheck } from 'lucide-react';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Candidate } from '@/lib/types';
import { splitCandidateName } from '@/lib/names';
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
  const isMobile = useIsMobile();
  const grouped = groupByArea(candidates);

  const renderAreaContent = (items: Candidate[]) => (
    <ul className="candidates-cited-today-modal__list">
      {items.map((c) => {
        const { apellidos, nombres } = splitCandidateName(c.nombre);
        const detalle = [c.puesto, c.seccion]
          .map((v) => v?.trim())
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={c.id ?? c.nombre} className="candidates-cited-today-modal__item">
            <div className="candidates-cited-today-modal__main">
              <span className="candidates-cited-today-modal__name">
                <span className="candidates-cited-today-modal__apellidos">{apellidos.toUpperCase()}</span>
                {nombres && <span className="candidates-cited-today-modal__nombres">{nombres.toUpperCase()}</span>}
              </span>
              {detalle && (
                <span className="candidates-cited-today-modal__puesto">{detalle}</span>
              )}
            </div>
            {c.reclutador && (
              <div className="candidates-cited-today-modal__meta">
                <span className="candidates-cited-today-modal__reclutador">{c.reclutador}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidates-cited-today-modal"
      icon={<CalendarCheck size={20} aria-hidden="true" />}
      title="Personal citado"
      subtitle="Detalle de candidatos citados"
      size={isMobile ? 'md' : 'lg'}
      fullscreenMobile={true}
    >
      <div className="modal-body candidates-cited-today-modal__body">
        <header className="candidates-cited-today-modal__summary">
          <div className="candidates-cited-today-modal__big-number">
            {candidates.length}
          </div>
          <p className="candidates-cited-today-modal__big-label">
            {candidates.length === 1 ? 'Candidato' : 'Candidatos'}
          </p>
        </header>

        {candidates.length === 0 ? (
          <p className="candidates-cited-today-modal__empty">
            No hay candidatos citados hoy.
          </p>
        ) : (
          <div className="candidates-cited-today-modal__groups">
            {isMobile ? (
              grouped.map(([area, items]) => (
                <ExpandableSection
                  key={area}
                  title={area}
                  badge={`${items.length} candidatos`}
                  variant="list"
                >
                  {renderAreaContent(items)}
                </ExpandableSection>
              ))
            ) : (
              grouped.map(([area, items]) => (
                <section
                  key={area}
                  className="candidates-cited-today-modal__area"
                  aria-label={`Area ${area}`}
                >
                  <h3 className="candidates-cited-today-modal__area-title">
                    {area} <span className="candidates-cited-today-modal__area-count">({items.length})</span>
                  </h3>
                  {renderAreaContent(items)}
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
