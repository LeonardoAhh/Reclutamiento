import { Fragment } from 'react';
import { Check, EllipsisVertical, LoaderCircle, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { playSound } from '@/lib/sound';

export type LeaveRequestActionKind = 'approve' | 'reject' | 'delete';

interface LeaveRequestTableMenuProps {
  requester: string;
  labels: {
    actions: string;
    approve: string;
    reject: string;
    delete: string;
    confirm: string;
  };
  canApprove: boolean;
  canDelete: boolean;
  confirmingKind: LeaveRequestActionKind | null;
  busy: boolean;
  disabled: boolean;
  onAction: (kind: LeaveRequestActionKind) => void;
  onClose: () => void;
}

export function LeaveRequestTableMenu({
  requester,
  labels,
  canApprove,
  canDelete,
  confirmingKind,
  busy,
  disabled,
  onAction,
  onClose,
}: LeaveRequestTableMenuProps) {
  const actions = [
    { kind: 'approve', icon: Check, label: labels.approve, allowed: canApprove },
    { kind: 'reject', icon: X, label: labels.reject, allowed: canApprove },
    { kind: 'delete', icon: Trash2, label: labels.delete, allowed: canDelete },
  ] as const;

  return (
    <DropdownMenu onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="btn-icon leave-requests-page__menu-trigger"
          aria-label={`${labels.actions}: ${requester}`}
          aria-busy={busy}
          disabled={disabled}
          onClick={() => playSound('tap')}
        >
          {busy ? (
            <LoaderCircle className="leave-requests-page__action-spinner" aria-hidden="true" />
          ) : (
            <EllipsisVertical aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={`${labels.actions}: ${requester}`}>
        {actions
          .filter((action) => action.allowed)
          .map(({ kind, icon: Icon, label }) => {
            const confirming = confirmingKind === kind;
            return (
              <Fragment key={kind}>
                {kind === 'delete' && canApprove && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  disabled={disabled || (confirmingKind !== null && !confirming)}
                  variant={kind === 'approve' ? 'default' : 'destructive'}
                  aria-label={confirming ? `${labels.confirm} ${label.toLowerCase()}` : label}
                  onSelect={(event) => {
                    if (!confirming) event.preventDefault();
                    onAction(kind);
                  }}
                >
                  <Icon aria-hidden="true" />
                  <span>{confirming ? labels.confirm : label}</span>
                </DropdownMenuItem>
              </Fragment>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
