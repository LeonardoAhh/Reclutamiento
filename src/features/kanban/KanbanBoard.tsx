import { useId, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent } from '@dnd-kit/core';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { isTaskStatus, TASK_STATUSES, type KanbanTask, type TaskDraft, type TaskStatus } from './types';
import { TaskForm } from './TaskForm';
import { KanbanColumn } from './KanbanColumn';
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
  getAddButton: () => HTMLButtonElement | null;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => Promise<boolean>;
  onMove: (task: KanbanTask, status: TaskStatus, beforeId: string | null) => Promise<boolean>;
  onArchive: (task: KanbanTask) => Promise<boolean>;
  now: number;
  onSave: (draft: TaskDraft) => Promise<boolean>;
  onCloseEditor: () => void;
}
export function KanbanBoard({ tasks, copy: t, disabled, busy, error, editor,
  getAddButton, onEdit, onDelete, onMove, onArchive, now, onSave, onCloseEditor }: KanbanBoardProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [pendingDropStatus, setPendingDropStatus] = useState<TaskStatus | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const pageSize = isDesktop ? 4 : 2;
  const headings = useRef<Partial<Record<TaskStatus, HTMLHeadingElement | null>>>({});
  const editButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates }),
  );
  const locked = disabled || editor !== null;
  function restoreEditorFocus(status: TaskStatus, taskId?: string) {
    requestAnimationFrame(() => {
      const target = taskId ? editButtons.current[taskId] : null;
      (target ?? getAddButton() ?? headings.current[status])?.focus();
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
    if (source && drop) {
      const changingColumn = source.status !== drop.status;
      if (changingColumn) setPendingDropStatus(drop.status);
      void onMove(source, drop.status, drop.beforeId).then(saved => {
        setPendingDropStatus(null);
        if (saved) requestAnimationFrame(() => editButtons.current[source.id]?.focus());
      });
    }
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
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)} onDragEnd={endDrag}
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
            <KanbanColumn
              key={status}
              status={status}
              tasks={rows}
              copy={t}
              locked={locked}
              dragging={dragging}
              pending={pendingDropStatus === status}
              now={now}
              headingId={headingId}
              headingRef={node => { headings.current[status] = node; }}
              editButtonRef={(taskId, node) => { editButtons.current[taskId] = node; }}
              onEdit={onEdit}
              pageSize={pageSize}
            />
          );
        })}
      </div>
      {form()}
    </DndContext>
  );
}
