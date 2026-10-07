import { CalendarCheck, CircleCheckBig } from 'lucide-react';
import { Modal } from './Modal';
import { FormSheet } from './FormSheet';
import { Badge, StarliteBadge, ReclutadorBadge } from './Badge';
import { ExpandableSection } from './ExpandableSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Candidate } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import { formatWhatsAppSection } from '@/lib/whatsappReport';

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
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const isMobile = useIsMobile();
  const Dialog = isMobile ? Modal : FormSheet;
  const grouped = groupByArea(candidates);

  const renderAreaContent = (items: Candidate[]) => (
    <ul className="candidates-cited-today-modal__list">
      {items.map((c) => {
        const seccion = formatWhatsAppSection(c.seccion ?? '', c.area);
        const detalle = [c.puesto, seccion]
          .map((v) => v?.trim())
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={c.id ?? c.nombre} className="candidates-cited-today-modal__item">
            <div className="candidates-cited-today-modal__main">
              <span className="candidates-cited-today-modal__name">
                {c.nombre.toUpperCase()}
              </span>
              {detalle && (
                <span className="candidates-cited-today-modal__puesto">{detalle}</span>
              )}
            </div>
            {(c.reclutador || c.is_starlite) && (
              <div className="candidates-cited-today-modal__meta">
                {c.is_starlite && <StarliteBadge compact />}
                {c.reclutador && (
                  <ReclutadorBadge nombre={c.reclutador} size="sm" />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="candidates-cited-today-modal"
      icon={<CalendarCheck size={20} aria-hidden="true" />}
      title={t("Detalle entrevistas")}
      size="md"
    >
      <div className="modal-body candidates-cited-today-modal__body">
        {candidates.length === 0 ? (
          <p className="candidates-cited-today-modal__empty">
            {t("No hay candidatos citados hoy.")}
          </p>
        ) : (
          <div className="candidates-cited-today-modal__groups">
            {isMobile ? (
              grouped.map(([area, items]) => (
                <ExpandableSection
                  key={area}
                  title={area}
                  badge={`${items.length} ${t("candidatos")}`}
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
                  aria-label={`${t("Area")} ${area}`}
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
    </Dialog>
  );
}
