import { useState } from 'react';
import { Check, EllipsisVertical, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { Language } from '@/contexts/LanguageContext';
import { playSound } from '@/lib/sound';

export type LeaveReviewKind = 'approve' | 'reject';

interface LeaveRequestActionsProps {
  /** Solicitante y periodo; completa el nombre accesible del disparador. */
  subject: string;
  language: Language;
  /** Decisión en curso para esta fila. */
  busyKind: LeaveReviewKind | null;
  disabled: boolean;
  onReview: (kind: LeaveReviewKind) => void;
}

const REVIEW_KINDS = ['approve', 'reject'] as const;

const ACTION_ICONS = { approve: Check, reject: X } as const;

const ACTION_TEXT = {
  approve: {
    label: { es: 'Autorizar', en: 'Approve' },
    confirm: { es: 'Confirmar autorización', en: 'Confirm approval' },
    busy: { es: 'Autorizando', en: 'Approving' },
  },
  reject: {
    label: { es: 'Rechazar', en: 'Reject' },
    confirm: { es: 'Confirmar rechazo', en: 'Confirm rejection' },
    busy: { es: 'Rechazando', en: 'Rejecting' },
  },
} as const;

/** Menú de decisión de una solicitud pendiente: elegir y confirmar en el mismo menú. */
export function LeaveRequestActions({ subject, language, busyKind, disabled, onReview }: LeaveRequestActionsProps) {
  const [confirming, setConfirming] = useState<LeaveReviewKind | null>(null);
  const locale = language === 'en' ? 'en' : 'es';
  const triggerLabel = busyKind ? ACTION_TEXT[busyKind].busy[locale] : locale === 'en' ? 'Actions' : 'Acciones';

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setConfirming(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="leave-approval-notifications__menu-trigger"
          disabled={disabled}
          aria-busy={busyKind !== null}
          aria-label={`${triggerLabel}: ${subject}`}
        >
          <EllipsisVertical aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(confirming ? [confirming] : REVIEW_KINDS).map((kind) => {
          const Icon = ACTION_ICONS[kind];
          const isConfirming = confirming === kind;

          return (
            <DropdownMenuItem
              asChild
              key={kind}
              onSelect={(event) => {
                if (!isConfirming) {
                  event.preventDefault();
                  setConfirming(kind);
                  return;
                }
                playSound('tap');
                onReview(kind);
              }}
            >
              <button type="button">
                <Icon aria-hidden="true" />
                <span>{ACTION_TEXT[kind][isConfirming ? 'confirm' : 'label'][locale]}</span>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
