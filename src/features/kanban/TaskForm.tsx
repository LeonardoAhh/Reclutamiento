import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { EMPTY_DRAFT, isTaskKind, isTaskStatus, TASK_KINDS, TASK_STATUSES, type TaskDraft, type TaskStatus } from './types';
import type { KanbanCopy } from './copy';

interface TaskFormProps {
  initial: TaskDraft | null;
  initialStatus: TaskStatus;
  copy: KanbanCopy;
  busy: boolean;
  error: string;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onSave: (draft: TaskDraft) => Promise<void>;
}
export function TaskForm({ initial, initialStatus, copy: t, busy, error, onClose, onDelete, onSave }: TaskFormProps) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const original = initial ?? { ...EMPTY_DRAFT, status: initialStatus };
  const [draft, setDraft] = useState<TaskDraft>(original);
  const [validation, setValidation] = useState('');
  const [discard, setDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = draft.title !== original.title || draft.description !== original.description
    || draft.kind !== original.kind || draft.status !== original.status;

  useEffect(() => { titleRef.current?.focus(); }, []);
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || discard) return;
    if (!draft.title.trim() || draft.title.trim().length > 160) {
      setValidation(t.required);
      titleRef.current?.focus();
      return;
    }
    setValidation('');
    await onSave(draft);
  }
  return (
    <form className="kanban-task kanban-form" aria-labelledby={`${id}-heading`} onSubmit={submit} aria-busy={busy}>
      <header className="kanban-form__header">
        <h4 id={`${id}-heading`} className="type-body-strong">{initial ? t.editTitle : t.create}</h4>
        {initial && onDelete && <button type="button" className="btn-ghost kanban-form__delete"
          disabled={busy || discard} aria-label={`${confirmDelete ? t.confirm : t.remove}: ${initial.title}`}
          aria-describedby={confirmDelete ? `${id}-delete-notice` : undefined}
          onBlur={() => setConfirmDelete(false)}
          onClick={() => { if (confirmDelete) { void onDelete(); } else setConfirmDelete(true); }}>
          <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />{confirmDelete ? t.confirm : t.remove}
        </button>}
      </header>
      <p id={`${id}-delete-notice`} className="sr-only" role="status">{confirmDelete ? t.removeText : ''}</p>
      <div className="form-group">
        <label htmlFor={`${id}-title`}>{t.titleLabel}</label>
        <input className="type-body-md" ref={titleRef} id={`${id}-title`} required maxLength={160} value={draft.title} disabled={busy || discard}
          aria-invalid={Boolean(validation)} aria-describedby={validation ? `${id}-validation` : undefined}
          onChange={event => { setDraft({ ...draft, title: event.target.value }); setValidation(''); }} />
        {validation && <p id={`${id}-validation`} className="form-error-text" role="alert">{validation}</p>}
      </div>
      <div className="form-grid kanban-form__classification">
        <div className="form-group">
          <label htmlFor={`${id}-kind`}>{t.kind}</label>
          <CustomSelect id={`${id}-kind`} value={draft.kind} disabled={busy || discard} showPlaceholderOption={false}
            options={TASK_KINDS.map(value => ({ value, label: t.kinds[value] }))}
            onChange={value => { if (isTaskKind(value)) setDraft({ ...draft, kind: value }); }} />
        </div>
        <div className="form-group">
          <label htmlFor={`${id}-status`}>{t.status}</label>
          <CustomSelect id={`${id}-status`} value={draft.status} disabled={busy || discard} showPlaceholderOption={false}
            options={TASK_STATUSES.map(value => ({ value, label: t.statuses[value] }))}
            onChange={value => { if (isTaskStatus(value)) setDraft({ ...draft, status: value }); }} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${id}-description`}>{t.description}</label>
        <textarea className="type-body-md" id={`${id}-description`} rows={4} maxLength={4000} value={draft.description} disabled={busy || discard}
          onChange={event => setDraft({ ...draft, description: event.target.value })} />
      </div>
      {error && <p className="form-error-text" role="alert">{error}</p>}
      {discard ? (
        <div className="kanban-form__discard" role="group" aria-labelledby={`${id}-discard`}>
          <p id={`${id}-discard`} className="type-body-md">{t.discardText}</p>
          <div className="kanban-task__actions">
            <button type="button" className="btn-secondary" autoFocus
              onClick={() => { setDiscard(false); requestAnimationFrame(() => cancelRef.current?.focus()); }}>{t.cancel}</button>
            <button type="button" className="btn-primary" onClick={onClose}>{t.discard}</button>
          </div>
        </div>
      ) : (
        <div className="kanban-task__actions">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={close} disabled={busy}>{t.cancel}</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? t.saving : t.save}</button>
        </div>
      )}
    </form>
  );
}
