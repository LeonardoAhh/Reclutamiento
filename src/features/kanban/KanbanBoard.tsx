import { useId, useRef, useState, type ReactNode } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useDndContext, useDroppable, useSensor, useSensors,
  type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { KanbanStatusBadge } from './KanbanBadge';
import { isTaskStatus, TASK_STATUSES, type KanbanTask, type TaskDraft, type TaskStatus } from './types';
import { TaskForm } from './TaskForm';
import { KanbanTaskCard } from './KanbanTaskCard';
import { kanbanCollision, kanbanKeyboardCoordinates, resolveTaskDrop } from './drag';
import type { KanbanCopy } from './copy';

export interface KanbanEditor {
  id: string;
  task: KanbanTask | null;
  status: TaskStatus;
}
interface KanbanBoardProps {
  tasks: readonly KanbanTask[];
  copy: KanbanCopy;
  disabled: boolean;
  busy: boolean;
  error: string;
  editor: KanbanEditor | null;
  onCreate: (status: TaskStatus) => void;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => Promise<boolean>;
  onMove: (task: KanbanTask, status: TaskStatus, beforeId: string | null) => Promise<boolean>;
  onArchive: (task: KanbanTask) => Promise<boolean>;
  now: number;
  onSave: (draft: TaskDraft) => Promise<boolean>;
  onCloseEditor: () => void;
}
function DropColumn({ status, disabled, empty, headingId, children }: {
  status: TaskStatus; disabled: boolean; empty: boolean; headingId: string; children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled });
  const { over } = useDndContext();
  const highlighted = isOver || over?.data.current?.status === status;
  return <section ref={setNodeRef} className="kanban-column" aria-labelledby={headingId}
    data-create={status === 'pending' || undefined} data-empty={empty || undefined} data-drag-over={highlighted || undefined}>{children}</section>;
}
export function KanbanBoard({ tasks, copy: t, disabled, busy, error, editor,
  onCreate, onEdit, onDelete, onMove, onArchive, now, onSave, onCloseEditor }: KanbanBoardProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const headings = useRef<Partial<Record<TaskStatus, HTMLHeadingElement | null>>>({});
  const addButtons = useRef<Partial<Record<TaskStatus, HTMLButtonElement | null>>>({});
  const editButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates }),
  );
  const locked = disabled || editor !== null;
  function restoreEditorFocus(status: TaskStatus, taskId?: string) {
    requestAnimationFrame(() => {
      const target = taskId ? editButtons.current[taskId] : addButtons.current[status];
      (target ?? headings.current[status])?.focus();
    });
  }
  function closeEditor() {
    if (!editor) return;
    onCloseEditor();
    restoreEditorFocus(editor.status, editor.task?.id);
  }
  async function save(draft: TaskDraft) {
    if (await onSave(draft)) restoreEditorFocus(draft.status, editor?.task?.id);
  }
  function endDrag({ active, over }: DragEndEvent) {
    setDragging(false);
    if (locked || !over) return;
    const rect = active.rect.current.translated;
    const source = tasks.find(task => task.id === active.id);
    const target = tasks.find(task => task.id === over.id);
    const originalRows = tasks.filter(task => task.status === source?.status);
    const sameColumnAfter = originalRows.findIndex(task => task.id === active.id) < originalRows.findIndex(task => task.id === over.id);
    const after = rect ? rect.top + rect.height / 2 > over.rect.top + over.rect.height / 2 : sameColumnAfter;
    const drop = resolveTaskDrop(tasks, String(active.id), String(over.id),
      target?.status === source?.status ? sameColumnAfter : after);
    if (source && drop) void onMove(source, drop.status, drop.beforeId).then(saved => {
      if (saved) requestAnimationFrame(() => editButtons.current[source.id]?.focus());
    });
  }
  async function archive() {
    if (!editor?.task) return;
    if (await onArchive(editor.task)) restoreEditorFocus(editor.status);
  }
  async function remove() {
    if (!editor?.task) return;
    if (await onDelete(editor.task)) restoreEditorFocus(editor.status);
  }
  function form() {
    return editor && <TaskForm key={editor.id} initial={editor.task} initialStatus={editor.status}
      copy={t} busy={busy} error={error} onClose={closeEditor} onSave={save} onDelete={editor.task ? remove : undefined}
      onArchive={editor.task ? archive : undefined} />;
  }
  const overStatus = (overId: string | number | undefined) => isTaskStatus(overId) ? overId : tasks.find(task => task.id === overId)?.status;
  const moveAnnouncement = (overId: string | number | undefined) => {
    const status = overStatus(overId);
    return status ? `${t.moveTo} ${t.statuses[status]}` : t.dragCancel;
  };
  const taskTitle = (taskId: string | number) => tasks.find(task => task.id === taskId)?.title ?? '';
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={kanbanCollision}
      onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={endDrag}
      accessibility={{ screenReaderInstructions: { draggable: t.dragInstructions }, announcements: {
        onDragStart: ({ active }) => `${t.drag}: ${taskTitle(active.id)}. ${t.dragInstructions}`,
        onDragOver: ({ over }) => moveAnnouncement(over?.id),
        onDragEnd: ({ over }) => moveAnnouncement(over?.id),
        onDragCancel: () => t.dragCancel,
      } }}>
      <div className="kanban-board" data-dragging={dragging || undefined}>
        {TASK_STATUSES.map(status => {
          const rows = tasks.filter(task => task.status === status);
          const headingId = `${id}-${status}`;
          return (
            <DropColumn key={status} status={status} disabled={locked} empty={rows.length === 0 && !dragging} headingId={headingId}>
              <header className="kanban-column__header">
                <h3 id={headingId} className="type-body-strong" tabIndex={-1}
                  ref={node => { headings.current[status] = node; }}><KanbanStatusBadge status={status} copy={t} /></h3>
                <Badge className="kanban-column__count">{rows.length}</Badge>
              </header>
              <SortableContext items={rows.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <ul className="kanban-column__list">
                {rows.length === 0 && dragging && <li className="kanban-column__empty type-body-md">{t.dropHere}</li>}
                {rows.map(task => (
                  <li key={task.id}>
                    <KanbanTaskCard task={task} copy={t} disabled={locked} now={now}
                      editButtonRef={node => { editButtons.current[task.id] = node; }}
                      onEdit={() => onEdit(task)} />
                  </li>
                ))}
              </ul>
              </SortableContext>
              {status === 'pending' && <footer className="kanban-column__footer">
                {(
                  <button type="button" className="btn-ghost kanban-column__add" disabled={locked || dragging}
                    ref={node => { addButtons.current[status] = node; }}
                    aria-label={`${t.addCard}: ${t.statuses[status]}`} onClick={() => onCreate(status)}>
                    <Plus size="var(--icon-size-sm)" aria-hidden="true" />{t.addCard}
                  </button>
                )}
              </footer>}
            </DropColumn>
          );
        })}
      </div>
      {form()}
    </DndContext>
  );
}
