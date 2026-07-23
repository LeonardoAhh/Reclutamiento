import type { CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUS_LABEL } from '@/lib/types';

import './CandidateStatusBadge.css';

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
  count?: number;
}

export function CandidateStatusBadge({ status, count }: CandidateStatusBadgeProps) {
  return (
    <span className="candidate-status-badge" data-status={status}>
      {CANDIDATE_STATUS_LABEL[status]}
      {count !== undefined && count > 0 && ` (${count})`}
    </span>
  );
}
