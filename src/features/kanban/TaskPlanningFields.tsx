import { Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { CHECKLIST_MAX_ITEMS, CHECKLIST_TEXT_LIMIT, type TaskDraft } from './types';
import { templateSteps } from './templates';
import type { KanbanCopy } from './copy';

interface TaskPlanningFieldsProps {
  id: string;
  draft: TaskDraft;
  copy: KanbanCopy;
  disabled: boolean;
  creating: boolean;
  invalid: boolean;
  scheduleInvalid: boolean;
  onChange: (draft: TaskDraft) => void;
}
export function TaskPlanningFields({ id, draft, copy: t, disabled, creating, invalid, scheduleInvalid, onChange }: TaskPlanningFieldsProps) {
  const updateStep = (stepId: string, changes: { text?: string; done?: boolean }) => {
    onChange({ ...draft, checklist: draft.checklist.map(step => step.id === stepId ? { ...step, ...changes } : step) });
  };
  return <>
    <div className="form-grid kanban-form__classification">
      <div className="form-group">
        <label htmlFor={`${id}-due-date`}>{t.dueDate}</label>
        <input id={`${id}-due-date`} type="date" min="0001-01-01" max="9999-12-31" className="type-body-md" aria-invalid={scheduleInvalid}
          aria-describedby={scheduleInvalid ? `${id}-validation` : undefined} value={draft.due_date ?? ''} disabled={disabled}
          onChange={event => onChange({ ...draft, due_date: event.target.value || null,
            due_time: event.target.value ? draft.due_time : null })} />
      </div>
      <div className="form-group">
        <label htmlFor={`${id}-due-time`}>{t.dueTime}</label>
        <input id={`${id}-due-time`} type="time" className="type-body-md" value={draft.due_time ?? ''}
          disabled={disabled || !draft.due_date} aria-invalid={scheduleInvalid}
          aria-describedby={scheduleInvalid ? `${id}-validation` : undefined}
          onChange={event => onChange({ ...draft, due_time: event.target.value || null })} />
      </div>
    </div>
    <fieldset className="kanban-checklist" disabled={disabled} aria-describedby={invalid ? `${id}-validation` : undefined}>
      <legend className="kanban-field-label">{t.checklist}</legend>
      {draft.checklist.length > 0 && <ul className="kanban-checklist__list">
        {draft.checklist.map((step, index) => <li key={step.id} className="kanban-checklist__row" data-completed={step.done || undefined}>
          <Checkbox checked={step.done} aria-label={`${t.markStep}: ${step.text || index + 1}`}
            onChange={event => updateStep(step.id, { done: event.target.checked })} />
          <div className="form-group"><label className="sr-only" htmlFor={`${id}-${step.id}`}>{t.step} {index + 1}</label>
          <input id={`${id}-${step.id}`} className="kanban-checklist__input type-body-md" value={step.text} required maxLength={CHECKLIST_TEXT_LIMIT}
            aria-invalid={invalid && !step.text.trim()} aria-describedby={invalid ? `${id}-validation` : undefined}
            onChange={event => updateStep(step.id, { text: event.target.value })} /></div>
          <button type="button" className="btn-ghost kanban-checklist__remove" aria-label={`${t.removeStep}: ${step.text || index + 1}`}
            onClick={() => onChange({ ...draft, checklist: draft.checklist.filter(item => item.id !== step.id) })}>
            <X size="var(--icon-size-sm)" aria-hidden="true" />
          </button>
        </li>)}
      </ul>}
      <div className="kanban-checklist__tools">
        <button type="button" className="btn-ghost" disabled={draft.checklist.length >= CHECKLIST_MAX_ITEMS}
          onClick={() => onChange({ ...draft, checklist: [...draft.checklist, { id: crypto.randomUUID(), text: '', done: false }] })}>
          <Plus size="var(--icon-size-sm)" aria-hidden="true" />{t.addStep}
        </button>
        {creating && draft.checklist.length === 0 && <button type="button" className="btn-ghost"
          onClick={() => onChange({ ...draft, checklist: templateSteps(draft.kind, t).map(text => ({ id: crypto.randomUUID(), text, done: false })) })}>
          {t.useTemplate}
        </button>}
      </div>
      {draft.checklist.length >= CHECKLIST_MAX_ITEMS && <p className="type-body-sm">{t.stepLimit}</p>}
    </fieldset>
  </>;
}
