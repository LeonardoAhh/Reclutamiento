import { useCallback, useId, useRef, useState } from 'react';
import { Archive, ArrowLeft, SquarePlus } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { kanbanCopy } from './copy';
import { KanbanBoard, type KanbanEditor } from './KanbanBoard';
import { KanbanSkeleton } from './KanbanSkeleton';
import { ArchivedTasks } from './ArchivedTasks';
import type { KanbanTask, TaskDraft, TaskStatus } from './types';
import { useKanban } from './useKanban';
import { useKanbanClock } from './useKanbanClock';
import './KanbanPage.css';

export function KanbanPage() {
  const { profile } = useAuth();
  return profile ? <PersonalKanban key={profile.id} userId={profile.id} /> : null;
}
function PersonalKanban({ userId }: { userId: string }) {
  const [archived, setArchived] = useState(false);
  const [focusView, setFocusView] = useState(false);
  return <KanbanWorkspace key={String(archived)} userId={userId} archived={archived} focusView={focusView}
    onChangeView={value => { setFocusView(true); setArchived(value); }} />;
}
function KanbanWorkspace({ userId, archived, focusView, onChangeView }: {
  userId: string; archived: boolean; focusView: boolean; onChangeView: (value: boolean) => void;
}) {
  const { language } = useLanguage();
  const t = kanbanCopy[language];
  const board = useKanban(userId, archived);
  const now = useKanbanClock();
  const id = useId();
  const viewRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [editor, setEditor] = useState<KanbanEditor | null>(null);
  const [message, setMessage] = useState('');
  const viewFocusDone = useRef(false);
  const attachViewButton = useCallback((node: HTMLButtonElement | null) => {
    viewRef.current = node;
    if (node && focusView && !viewFocusDone.current) {
      viewFocusDone.current = true;
      node.focus();
    }
  }, [focusView]);
  const disabled = board.busy || board.loading || !board.ready;
  const actionError = board.actionError ? t.errors[board.actionError] : '';
  function openEditor(task: KanbanTask | null, status: TaskStatus = 'pending') {
    board.clearActionError();
    setMessage('');
    setEditor({ id: task?.id ?? crypto.randomUUID(), task, status: task?.status ?? status });
  }
  async function save(draft: TaskDraft, coverFile: File | null, coverUploadId: string | null) {
    if (!editor) return false;
    const saved = await board.save(editor.id, draft, editor.task?.version ?? null, coverFile, coverUploadId);
    if (saved) { setEditor(null); setMessage(t.saved); }
    return saved;
  }
  async function move(task: KanbanTask, status: TaskStatus, beforeId: string | null) {
    setMessage('');
    const saved = await board.reorder(task, status, beforeId);
    if (saved) setMessage(`${t.reordered}: ${task.title}, ${t.statuses[status]}`);
    return saved;
  }
  async function remove(task: KanbanTask) {
    setMessage('');
    const removed = await board.remove(task);
    if (removed) { setEditor(null); setMessage(t.deleted); }
    return removed;
  }
  async function archive(task: KanbanTask) {
    setMessage('');
    const saved = await board.archive(task, !archived);
    if (saved) {
      setEditor(null); setMessage(archived ? t.restored : t.archived);
      if (archived) requestAnimationFrame(() => viewRef.current?.focus());
    }
    return saved;
  }
  const viewAction = (
    <button ref={attachViewButton} type="button" className="kanban-toolbar-button kanban-view-button"
      disabled={board.busy || editor !== null} aria-controls={id} onClick={() => onChangeView(!archived)}>
      {archived ? <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" /> : <Archive size="var(--icon-size-md)" aria-hidden="true" />}
      {archived ? t.backToBoard : t.archiveView}
    </button>
  );
  const addAction = !archived && (
    <button
      ref={addButtonRef}
      type="button"
      className="kanban-toolbar-button kanban-content__add"
      disabled={disabled || editor !== null}
      aria-label={`${t.addCard}: ${t.statuses.pending}`}
      onClick={() => openEditor(null, 'pending')}
    >
      <SquarePlus size="var(--icon-size-md)" aria-hidden="true" />
      {t.addCard}
    </button>
  );
  return (
    <main className="kanban-page type-body-md" aria-labelledby={`${id}-title`}>
      <PageHeading id={`${id}-title`} className="app-page-title">{t.title}</PageHeading>

      {!(board.loading && !board.ready) && <p className="sr-only" role="status">{board.loading ? t.loading : message}</p>}
      {board.loadError && <div className="kanban-feedback">
        <p className="form-error-text" role="alert">{t.errors[board.loadError]}</p>
        <button type="button" className="btn-secondary" disabled={board.loading || board.busy || editor !== null}
          onClick={() => { void board.load(); }}>{t.retry}</button>
      </div>}
      {actionError && !editor && <div className="kanban-feedback">
        <p className="form-error-text" role="alert">{actionError}</p>
        <button type="button" className="btn-secondary" disabled={disabled}
          onClick={() => { board.clearActionError(); void board.load(); }}>{t.retry}</button>
      </div>}
      {board.cleanupPending && <div className="kanban-feedback">
        <p className="form-error-text" role="alert">{t.photoCleanupFailed}</p>
        <button type="button" className="btn-secondary" disabled={disabled}
          onClick={() => { void board.retryCleanup(); }}>{t.retry}</button>
      </div>}
      <section id={id} aria-busy={board.loading} aria-labelledby={`${id}-heading`} className="kanban-content">
        {!archived && <h2 id={`${id}-heading`} className="sr-only">{t.board}</h2>}
        <div className="kanban-content__header">
          {archived ? <h2 id={`${id}-heading`} className="type-body-strong">{t.archiveView}</h2>
            : addAction}
          {viewAction}
        </div>
        {board.loading && !board.ready && <KanbanSkeleton label={t.loading} />}
        {board.ready && archived && board.tasks.length === 0 && <p className="type-body-md">{t.archiveEmpty}</p>}
        {board.ready && (archived ? <ArchivedTasks tasks={board.tasks} copy={t} disabled={disabled} onRestore={archive} />
          : <KanbanBoard tasks={board.tasks} copy={t} disabled={disabled} busy={board.busy} now={now}
            editor={editor} error={actionError} onEdit={task => openEditor(task)}
            getAddButton={() => addButtonRef.current}
            onDelete={remove} onMove={move} onArchive={archive}
            onSave={save} onCloseEditor={() => { setEditor(null); board.clearActionError(); }} />)}
      </section>
      {board.ready && board.tasks.length < board.total && <div className="kanban-more">
        <button type="button" className="btn-secondary" disabled={disabled || editor !== null}
          onClick={() => { void board.load(board.tasks.map(task => task.id)); }}>{t.more}</button>
      </div>}
    </main>
  );
}
