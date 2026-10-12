import { useId, useRef, useState, type ReactNode } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors,
  type DragEndEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { KanbanStatusBadge } from './KanbanBadge';
import { isTaskStatus, TASK_STATUSES, type KanbanTask, type TaskDraft, type TaskStatus } from './types';
import { TaskForm } from './TaskForm';
import { KanbanTaskCard } from './KanbanTaskCard';
import { kanbanCollision, kanbanKeyboardCoordinates } from './drag';
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
  onMove: (task: KanbanTask, status: TaskStatus) => Promise<boolean>;
  onSave: (draft: TaskDraft) => Promise<boolean>;
  onCloseEditor: () => void;
}
function DropColumn({ status, disabled, headingId, children }: {
  status: TaskStatus; disabled: boolean; headingId: string; children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled });
  return <section ref={setNodeRef} className="kanban-column" aria-labelledby={headingId}
    data-drag-over={isOver || undefined}>{children}</section>;
}
export function KanbanBoard({ tasks, copy: t, disabled, busy, error, editor,
  onCreate, onEdit, onDelete, onMove, onSave, onCloseEditor }: KanbanBoardProps) {
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
  async function move(task: KanbanTask, status: TaskStatus) {
    if (status === task.status) return;
    if (await onMove(task, status)) headings.current[status]?.focus();
  }
  function endDrag({ active, over }: DragEndEvent) {
    setDragging(false);
    if (locked || !isTaskStatus(over?.id)) return;
    const task = tasks.find(row => row.id === active.id);
    if (task) void move(task, over.id);
  }
  async function remove() {
    if (!editor?.task) return;
    if (await onDelete(editor.task)) restoreEditorFocus(editor.status);
  }
  function form() {
    return editor && <TaskForm key={editor.id} initial={editor.task} initialStatus={editor.status}
      copy={t} busy={busy} error={error} onClose={closeEditor} onSave={save} onDelete={editor.task ? remove : undefined} />;
  }
  const taskTitle = (taskId: string | number) => tasks.find(task => task.id === taskId)?.title ?? '';
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={kanbanCollision}
      onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={endDrag}
      accessibility={{ screenReaderInstructions: { draggable: t.dragInstructions }, announcements: {
        onDragStart: ({ active }) => `${t.drag}: ${taskTitle(active.id)}. ${t.dragInstructions}`,
        onDragOver: ({ over }) => isTaskStatus(over?.id) ? `${t.moveTo} ${t.statuses[over.id]}` : t.dragCancel,
        onDragEnd: ({ over }) => isTaskStatus(over?.id) ? `${t.moveTo} ${t.statuses[over.id]}. ${t.saving}` : t.dragCancel,
        onDragCancel: () => t.dragCancel,
      } }}>
      <div className="kanban-board" data-dragging={dragging || undefined}>
        {TASK_STATUSES.map(status => {
          const rows = tasks.filter(task => task.status === status);
          const headingId = `${id}-${status}`;
          const creating = editor?.status === status && editor.task === null;
          return (
            <DropColumn key={status} status={status} disabled={locked} headingId={headingId}>
              <header className="kanban-column__header">
                <h3 id={headingId} className="type-body-strong" tabIndex={-1}
                  ref={node => { headings.current[status] = node; }}><KanbanStatusBadge status={status} copy={t} /></h3>
                <Badge className="kanban-column__count">{rows.length}</Badge>
              </header>
              <ul className="kanban-column__list">
                {rows.length === 0 && <li className="kanban-column__empty type-body-md">{dragging ? t.dropHere : t.emptyColumn}</li>}
                {rows.map(task => (
                  <li key={task.id}>
                    {editor?.task?.id === task.id ? form() : (
                      <KanbanTaskCard task={task} copy={t} disabled={locked}
                        editButtonRef={node => { editButtons.current[task.id] = node; }}
                        onEdit={() => onEdit(task)} />
                    )}
                  </li>
                ))}
              </ul>
              <footer className="kanban-column__footer">
                {creating ? form() : (
                  <button type="button" className="btn-ghost kanban-column__add" disabled={locked || dragging}
                    ref={node => { addButtons.current[status] = node; }}
                    aria-label={`${t.addCard}: ${t.statuses[status]}`} onClick={() => onCreate(status)}>
                    <Plus size="var(--icon-size-sm)" aria-hidden="true" />{t.addCard}
                  </button>
                )}
              </footer>
            </DropColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
