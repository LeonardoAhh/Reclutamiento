import { CalendarClock, ChevronDown, CircleCheckBig, CircleX, FileCheck, FileExclamationPoint, MessageSquare, UserX, type LucideIcon } from 'lucide-react';
import type { CandidateStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { candidateStatusLabel } from '@/lib/candidateTranslations';

import './CandidateStatusBadge.css';

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
  count?: number;
  showCaret?: boolean;
  className?: string;
  compact?: boolean;
  /** Sustituye el punto de color por un icono representativo del estado. */
  icon?: boolean;
}

const COMPACT_LABELS: Partial<Record<CandidateStatus, string>> = {
  entrega_documentos: 'Entrega Docs',
  faltan_documentos: 'Faltan docs',
  feedback_pendiente: 'Feedback',
};

/** Icono por estado; el color lo aporta `data-status` desde el CSS. */
const STATUS_ICONS: Record<CandidateStatus, LucideIcon> = {
  entrevista: CalendarClock,
  entrega_documentos: FileCheck,
  faltan_documentos: FileExclamationPoint,
  feedback_pendiente: MessageSquare,
  contratado: CircleCheckBig,
  rechazado: CircleX,
  no_asistio: UserX,
};

export function CandidateStatusBadge({ status, count, showCaret, className = '', compact = false, icon = false }: CandidateStatusBadgeProps) {
  const { language } = useLanguage();
  const label = compact && language === 'es' && COMPACT_LABELS[status]
    ? COMPACT_LABELS[status] : candidateStatusLabel(status, language);
  const StatusIcon = STATUS_ICONS[status];

  return (
    <span className={`candidate-status-badge ${className}`.trim()} data-status={status}>
      {icon
        ? <StatusIcon size={14} className="candidate-status-badge__icon" aria-hidden="true" />
        : <span className="candidate-status-badge__dot" aria-hidden="true" />}
      {label}
      {count !== undefined && count > 0 && ` (${count})`}
      {showCaret && <ChevronDown className="candidate-status-caret" aria-hidden="true" />}
    </span>
  );
}
