import { useId, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { kanbanCopy } from './copy';
import { KanbanBoard, type KanbanEditor } from './KanbanBoard';
import type { KanbanTask, TaskDraft, TaskStatus } from './types';
import { useKanban } from './useKanban';
import './KanbanPage.css';

export function KanbanPage() {
  const { profile } = useAuth();
  return profile ? <PersonalKanban key={profile.id} userId={profile.id} /> : null;
}
function PersonalKanban({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const t = kanbanCopy[language];
  const board = useKanban(userId);
  const id = useId();
  const [editor, setEditor] = useState<KanbanEditor | null>(null);
  const [message, setMessage] = useState('');
  const disabled = board.busy || board.loading || !board.ready;
  const actionError = board.actionError ? t.errors[board.actionError] : '';
  function openEditor(task: KanbanTask | null, status: TaskStatus = 'pending') {
    board.clearActionError();
    setMessage('');
    setEditor({ id: task?.id ?? crypto.randomUUID(), task, status: task?.status ?? status });
  }
  async function save(draft: TaskDraft) {
    if (!editor) return false;
    const saved = await board.save(editor.id, draft, editor.task?.version ?? null);
    if (saved) { setEditor(null); setMessage(t.saved); }
    return saved;
  }
  async function move(task: KanbanTask, status: TaskStatus) {
    setMessage('');
    const saved = await board.save(task.id, { ...task, status }, task.version);
    if (saved) setMessage(`${t.changed}: ${task.title}, ${t.statuses[status]}`);
    return saved;
  }
  async function remove(task: KanbanTask) {
    setMessage('');
    const removed = await board.remove(task);
    if (removed) { setEditor(null); setMessage(t.deleted); }
    return removed;
  }
  return (
    <div className="container kanban-page type-body-md">
      <PageHeading className="app-page-title">{t.title}</PageHeading>
      <p className={board.loading ? "type-body-md" : "sr-only"} role="status">{board.loading ? t.loading : message}</p>
      {board.loadError && <div className="kanban-feedback">
        <p className="form-error-text" role="alert">{t.errors[board.loadError]}</p>
        <button type="button" className="btn-secondary" disabled={board.loading || board.busy || editor !== null}
          onClick={() => { void board.load(); }}>{t.retry}</button>
      </div>}
      {actionError && !editor && <p className="form-error-text" role="alert">{actionError}</p>}
      <section aria-busy={board.loading} aria-labelledby={id} className="kanban-content">
        <h2 id={id} className="sr-only">{t.board}</h2>
        {board.ready && board.tasks.length === 0 && <div className="kanban-notice">
          <p className="type-body-strong">{t.empty}</p>
          <p className="type-body-md">{t.emptyText}</p>
        </div>}
        {board.ready && <KanbanBoard tasks={board.tasks} copy={t} disabled={disabled} busy={board.busy}
          editor={editor} error={actionError} onCreate={status => openEditor(null, status)} onEdit={task => openEditor(task)}
          onDelete={remove} onMove={move}
          onSave={save} onCloseEditor={() => { setEditor(null); board.clearActionError(); }} />}
      </section>
      {board.ready && board.tasks.length < board.total && <div className="kanban-more">
        <button type="button" className="btn-secondary" disabled={disabled || editor !== null}
          onClick={() => { void board.load(board.tasks.length); }}>{t.more}</button>
      </div>}
    </div>
  );
}
