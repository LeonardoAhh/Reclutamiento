import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';
import { FormSheet } from '@/components/ui/FormSheet';
import { FormWizard } from '@/components/ui/FormWizard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { EMPTY_DRAFT, isTaskKind, isTaskStatus, TASK_KINDS, TASK_STATUSES, validateTaskDraft, type TaskDraft, type TaskStatus } from './types';
import { TaskPlanningFields } from './TaskPlanningFields';
import type { KanbanCopy } from './copy';

interface TaskFormProps {
  initial: TaskDraft | null;
  initialStatus: TaskStatus;
  copy: KanbanCopy;
  busy: boolean;
  error: string;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onSave: (draft: TaskDraft) => Promise<void>;
}
export function TaskForm({ initial, initialStatus, copy: t, busy, error, onClose, onDelete, onArchive, onSave }: TaskFormProps) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeFocusRef = useRef<HTMLElement | null>(null);
  const mobile = useIsMobile();
  const creating = initial === null;
  const wizard = creating && mobile;
  const original = initial ?? { ...EMPTY_DRAFT, status: initialStatus };
  const [draft, setDraft] = useState<TaskDraft>(original);
  const [validation, setValidation] = useState<ReturnType<typeof validateTaskDraft>>(null);
  const [discard, setDiscard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = draft.title !== original.title || draft.description !== original.description
    || draft.kind !== original.kind || draft.status !== original.status
    || draft.due_date !== original.due_date || draft.due_time !== original.due_time
    || JSON.stringify(draft.checklist) !== JSON.stringify(original.checklist);
  useEffect(() => { titleRef.current?.focus(); }, []);
  function close() {
    if (busy) return;
    if (dirty) {
      if (!discard) closeFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setDiscard(true);
    }
    else onClose();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || discard || (wizard && wizardStep === 0)) return;
    const problem = validateTaskDraft(draft);
    if (problem) {
      setValidation(problem);
      const field = problem === 'required' ? titleRef.current
        : problem === 'descriptionLimit' ? event.currentTarget.querySelector<HTMLTextAreaElement>('textarea')
        : problem === 'invalidChecklist' ? Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('.kanban-checklist input:not([type="checkbox"])')).find(input => !input.value.trim())
        : event.currentTarget.querySelector<HTMLInputElement>('input[type="date"]');
      field?.focus();
      return;
    }
    setValidation(null);
    await onSave(draft);
  }
  const details = <>
    <div className="form-group">
      <label htmlFor={`${id}-title`}>{t.titleLabel}</label>
      <input className="type-body-md" ref={titleRef} id={`${id}-title`} required maxLength={160}
        value={draft.title} disabled={busy || discard} aria-invalid={validation === 'required'}
        aria-describedby={validation === 'required' ? `${id}-validation` : undefined}
        onChange={event => { setDraft({ ...draft, title: event.target.value }); setValidation(null); }} />
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
      <textarea className="type-body-md" id={`${id}-description`} rows={4} maxLength={4000}
        aria-invalid={validation === 'descriptionLimit'}
        aria-describedby={validation === 'descriptionLimit' ? `${id}-validation` : undefined}
        value={draft.description} disabled={busy || discard}
        onChange={event => setDraft({ ...draft, description: event.target.value })} />
    </div>
  </>;
  const planning = <TaskPlanningFields id={id} draft={draft} copy={t} disabled={busy || discard} creating={creating}
    scheduleInvalid={validation === 'invalidDue' || validation === 'timeNeedsDate'}
    invalid={validation === 'invalidChecklist'} onChange={next => { setDraft(next); setValidation(null); }} />;
  const notice = <>
    {validation && <p id={`${id}-validation`} className="form-error-text" role="alert">{t[validation]}</p>}
    {error && <p className="form-error-text" role="alert">{error}</p>}
  </>;
  const actions = <div className="kanban-task__actions">
    <button ref={cancelRef} type="button" className="btn-secondary" onClick={close} disabled={busy}>{t.cancel}</button>
    <button type="submit" form={`${id}-form`} className="btn-primary" disabled={busy}>{busy ? t.saving : t.save}</button>
  </div>;
  const discardNotice = <div className="kanban-form__discard" role="group" aria-labelledby={`${id}-discard`}>
    <p id={`${id}-discard`} className="type-body-md">{t.discardText}</p>
    <div className="kanban-task__actions">
      <button type="button" className="btn-secondary" autoFocus
        onClick={() => {
          setDiscard(false);
          requestAnimationFrame(() => {
            const origin = closeFocusRef.current;
            const target = origin?.isConnected ? origin : cancelRef.current ?? formRef.current?.querySelector<HTMLElement>('input, textarea, button');
            target?.focus();
          });
        }}>{t.cancel}</button>
      <button type="button" className="btn-primary" onClick={onClose}>{t.discard}</button>
    </div>
  </div>;
  const deleteAction = initial && onDelete ? <button type="button" className="btn-ghost kanban-form__delete" disabled={busy || discard}
    aria-label={`${confirmDelete ? t.confirm : t.remove}: ${initial.title}`}
    aria-describedby={confirmDelete ? `${id}-delete-notice` : undefined} onBlur={() => setConfirmDelete(false)}
    onClick={() => { if (confirmDelete) void onDelete(); else setConfirmDelete(true); }}>
    <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />{confirmDelete ? t.confirm : t.remove}
  </button> : undefined;
  const form = <form ref={formRef} id={`${id}-form`} className={`kanban-dialog-form${wizard ? ' modal-wizard-form' : ''}`}
    aria-label={creating ? t.create : t.editTitle}
    onSubmit={submit} noValidate={wizard} aria-busy={busy}>
    {initial && <p id={`${id}-delete-notice`} className="sr-only" role="status">{confirmDelete ? t.removeText : ''}</p>}
    {wizard ? discard ? discardNotice : <FormWizard
      initialStep={wizardStep} onCancel={close} submitting={busy} navigationPending={busy} focusStepOnChange
      submitLabel={t.save} submittingLabel={t.saving} notice={notice}
      onBeforeStepChange={(current, next) => {
        if (next <= current) { setWizardStep(next); return true; }
        const problem = validateTaskDraft({ ...draft, due_date: null, due_time: null, checklist: [] });
        setValidation(problem);
        if (problem) titleRef.current?.focus();
        if (!problem) setWizardStep(next);
        return problem === null;
      }}
      steps={[
        { id: 'details', title: t.detailsStep, content: details },
        { id: 'planning', title: t.planningStep, content: planning },
      ]} /> : <>
      {notice}{details}{planning}
      {initial?.status === 'completed' && onArchive && <div>
        <button type="button" className="btn-ghost" disabled={busy || discard || dirty}
          aria-describedby={dirty ? `${id}-archive-help` : undefined} onClick={() => { void onArchive(); }}>
          <Archive size="var(--icon-size-sm)" aria-hidden="true" />{t.archive}
        </button>
        {dirty && <p id={`${id}-archive-help`} className="type-body-sm kanban-form__help">{t.archiveHelp}</p>}
      </div>}
    </>}
  </form>;
  const Dialog = mobile ? Modal : FormSheet;
  return <Dialog isOpen title={creating ? t.create : t.editTitle} onClose={close} size="sm"
    className={`kanban-task-dialog type-body-md${wizard ? ' modal-wizard-mobile' : ''}`}
    presentation="modal" headerActions={deleteAction}
    footerActions={wizard ? undefined : discard ? discardNotice : actions}>{form}</Dialog>;
}
