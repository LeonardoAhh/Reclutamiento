import { ArrowRight } from 'lucide-react';

interface CareerJourneySummaryProps {
  destinationPosition?: string;
  destinationRobot: string;
  firstAction?: string;
  isLeaving: boolean;
  onClose: () => void;
}

function SummaryPosition({ label, value, robot }: { label: string; value?: string; robot: string }) {
  return (
    <div className="career-page__summary-position">
      <img className="career-page__robot" src={robot} alt="" />
      <dl className="career-page__summary-position-copy">
        <dt className="type-body-md">{label}</dt>
        <dd className="type-heading-md">{value ?? 'Sin seleccionar'}</dd>
      </dl>
    </div>
  );
}

export function CareerJourneySummary({
  destinationPosition, destinationRobot, firstAction, isLeaving, onClose,
}: CareerJourneySummaryProps) {
  return (
    <div className="career-page__summary">
      <div className="career-page__summary-route">
        <SummaryPosition label="Tu objetivo" value={destinationPosition} robot={destinationRobot} />
      </div>
      <dl className="career-page__summary-details">
        <div className="career-page__summary-detail">
          <dt className="type-body-md">El primer paso</dt>
          <dd className="type-body-lg">{firstAction ?? 'Sin seleccionar'}</dd>
        </div>
      </dl>
      <div className="career-page__actions">
        <button type="button" className="btn-secondary career-page__continue"
          disabled={isLeaving} aria-busy={isLeaving} onClick={onClose}>
          ¡Vamos! <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
