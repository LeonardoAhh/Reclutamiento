import type { CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUS_LABEL } from '@/lib/types';
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
  entrega_documentos: 'Docs entregados',
  faltan_documentos: 'Faltan docs',
  feedback_pendiente: 'Feedback',
};

export function CandidateStatusBadge({ status, count, showCaret, className = '', compact = false }: CandidateStatusBadgeProps) {
  const label = compact && COMPACT_LABELS[status] ? COMPACT_LABELS[status] : CANDIDATE_STATUS_LABEL[status];

  return (
    <span className={`candidate-status-badge ${className}`.trim()} data-status={status}>
      {label}
      {count !== undefined && count > 0 && ` (${count})`}
      {showCaret && <ChevronDown size={12} className="candidate-status-caret" aria-hidden="true" />}
    </span>
  );
}
