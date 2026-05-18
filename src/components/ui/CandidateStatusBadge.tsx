import type { CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUS_LABEL } from '@/lib/types';
import { Badge } from './Badge';

const VARIANT: Record<
  CandidateStatus,
  'default' | 'coral' | 'teal' | 'amber' | 'success' | 'error'
> = {
  entrevista_1: 'amber',
  entrevista_2: 'amber',
  contratado: 'success',
  rechazado: 'error',
};

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
}

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{CANDIDATE_STATUS_LABEL[status]}</Badge>;
}
