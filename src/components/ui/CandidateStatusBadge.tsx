import type { CandidateStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { candidateStatusLabel } from '@/lib/candidateTranslations';
import { ChevronDown } from 'lucide-react';

import './CandidateStatusBadge.css';

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
  count?: number;
  showCaret?: boolean;
  className?: string;
  compact?: boolean;
}

const COMPACT_LABELS: Partial<Record<CandidateStatus, string>> = {
  entrega_documentos: 'Entrega Docs',
  faltan_documentos: 'Faltan docs',
  feedback_pendiente: 'Feedback',
};

export function CandidateStatusBadge({ status, count, showCaret, className = '', compact = false }: CandidateStatusBadgeProps) {
  const { language } = useLanguage();
  const label = compact && language === 'es' && COMPACT_LABELS[status]
    ? COMPACT_LABELS[status] : candidateStatusLabel(status, language);

  return (
    <span className={`candidate-status-badge ${className}`.trim()} data-status={status}>
      <span className="candidate-status-badge__dot" aria-hidden="true" />
      {label}
      {count !== undefined && count > 0 && ` (${count})`}
      {showCaret && <ChevronDown className="candidate-status-caret" aria-hidden="true" />}
    </span>
  );
}
